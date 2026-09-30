const { pool } = require('../config/database.cjs');

// 1. Simpan Transaksi Baru (Payment - HANYA PETUGAS)
const createTransaction = async (req, res) => {
  // Verifikasi role di controller untuk keamanan ganda
  if (req.user.role !== 'petugas') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Fitur pembayaran/kasir hanya boleh diproses oleh Petugas.'
    });
  }

  const connection = await pool.getConnection();

  try {
    const { items, member_id, bayar } = req.body;

    // Validasi keranjang belanja
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja masih kosong. Tambahkan barang terlebih dahulu.'
      });
    }

    const numericBayar = parseFloat(bayar);
    if (isNaN(numericBayar) || numericBayar <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal pembayaran tidak valid.'
      });
    }

    // Mulai transaksi database (ACID)
    await connection.beginTransaction();

    let calculatedTotal = 0;
    const verifiedItems = [];

    // Validasi setiap item & ketersediaan stok
    for (const item of items) {
      const productId = parseInt(item.product_id);
      const qty = parseInt(item.jumlah);

      if (!productId || isNaN(qty) || qty <= 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Data barang di keranjang tidak valid.'
        });
      }

      // Lock row produk untuk membaca data terkini dan mencegah race condition
      const [productRows] = await connection.query(
        'SELECT id, barcode, nama_barang, harga, stok, satuan FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: `Barang dengan ID #${productId} tidak ditemukan.`
        });
      }

      const product = productRows[0];

      // Pengecekan stok sesuai requirement: "Stok barang tidak mencukupi."
      if (product.stok < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok barang tidak mencukupi untuk "${product.nama_barang}". Tersedia: ${product.stok} ${product.satuan}, diminta: ${qty} ${product.satuan}.`
        });
      }

      const itemPrice = parseFloat(product.harga);
      const subtotal = itemPrice * qty;
      calculatedTotal += subtotal;

      verifiedItems.push({
        product_id: product.id,
        nama_barang: product.nama_barang,
        barcode: product.barcode,
        satuan: product.satuan,
        harga: itemPrice,
        jumlah: qty,
        subtotal: subtotal,
        stok_sisa: product.stok - qty
      });
    }

    // Validasi uang bayar tidak boleh kurang dari total belanja
    if (numericBayar < calculatedTotal) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Uang pembayaran kurang! Total belanja: Rp${calculatedTotal.toLocaleString('id-ID')}, Uang bayar: Rp${numericBayar.toLocaleString('id-ID')}.`
      });
    }

    const kembalian = numericBayar - calculatedTotal;

    // Generate nomor transaksi unik, contoh: TRX-20260929-12345
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nomorTransaksi = `TRX-${todayStr}-${randomSuffix}`;

    // 1. Simpan header transaksi
    const [trxResult] = await connection.query(
      `INSERT INTO transactions (nomor_transaksi, user_id, member_id, total, bayar, kembalian, tanggal_transaksi)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [nomorTransaksi, req.user.id, member_id ? parseInt(member_id) : null, calculatedTotal, numericBayar, kembalian]
    );

    const transactionId = trxResult.insertId;

    // 2. Simpan detail transaksi dan kurangi stok otomatis
    for (const item of verifiedItems) {
      // Simpan ke transaction_details
      await connection.query(
        `INSERT INTO transaction_details (transaction_id, product_id, jumlah, harga, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.product_id, item.jumlah, item.harga, item.subtotal]
      );

      // Kurangi stok otomatis
      await connection.query(
        'UPDATE products SET stok = stok - ? WHERE id = ?',
        [item.jumlah, item.product_id]
      );
    }

    // Commit transaksi ke database
    await connection.commit();

    // Ambil data lengkap untuk respon struk
    let memberData = null;
    if (member_id) {
      const [mRows] = await connection.query('SELECT id, nama, no_hp, alamat FROM members WHERE id = ?', [member_id]);
      if (mRows.length > 0) memberData = mRows[0];
    }

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses!',
      data: {
        id: transactionId,
        nomor_transaksi: nomorTransaksi,
        kasir: req.user.username,
        member: memberData,
        items: verifiedItems,
        total: calculatedTotal,
        bayar: numericBayar,
        kembalian: kembalian,
        tanggal_transaksi: new Date().toISOString()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in createTransaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat memproses transaksi.'
    });
  } finally {
    connection.release();
  }
};

// 2. Ambil Semua Transaksi (Bisa diakses Admin & Petugas)
const getAllTransactions = async (req, res) => {
  try {
    const { period, startDate, endDate, search } = req.query;

    let query = `
      SELECT 
        t.id,
        t.nomor_transaksi,
        t.total,
        t.bayar,
        t.kembalian,
        t.tanggal_transaksi,
        u.username AS petugas,
        m.nama AS nama_member,
        m.no_hp AS no_hp_member,
        COUNT(td.id) AS total_item
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE 1=1
    `;
    const params = [];

    // Filter Periode
    if (period === 'today') {
      query += ' AND DATE(t.tanggal_transaksi) = CURDATE()';
    } else if (period === 'this_week') {
      query += ' AND YEARWEEK(t.tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'this_month') {
      query += ' AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
    } else if (period === 'custom' && startDate && endDate) {
      query += ' AND DATE(t.tanggal_transaksi) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (search) {
      query += ' AND (t.nomor_transaksi LIKE ? OR u.username LIKE ? OR m.nama LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY t.id ORDER BY t.id DESC';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar riwayat transaksi.'
    });
  }
};

// 3. Ambil Detail Transaksi berdasarkan ID (Untuk Cetak Ulang Struk / Modal Detail)
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [tRows] = await pool.query(`
      SELECT 
        t.id,
        t.nomor_transaksi,
        t.total,
        t.bayar,
        t.kembalian,
        t.tanggal_transaksi,
        u.username AS petugas,
        m.nama AS nama_member,
        m.no_hp AS no_hp_member,
        m.alamat AS alamat_member
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      WHERE t.id = ?
    `, [id]);

    if (tRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.'
      });
    }

    const transaction = tRows[0];

    // Ambil detail items
    const [dRows] = await pool.query(`
      SELECT 
        td.id,
        td.product_id,
        p.barcode,
        p.nama_barang,
        p.satuan,
        td.harga,
        td.jumlah,
        td.subtotal
      FROM transaction_details td
      JOIN products p ON td.product_id = p.id
      WHERE td.transaction_id = ?
      ORDER BY td.id ASC
    `, [id]);

    transaction.items = dRows;

    return res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error in getTransactionById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail transaksi.'
    });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById
};
