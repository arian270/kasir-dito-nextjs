const { pool } = require('../config/database.cjs');

// 1. Ambil semua produk (Bisa diakses Admin & Petugas)
const getAllProducts = async (req, res) => {
  try {
    const { search, kategori, page, limit } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nama_barang LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (kategori && kategori !== 'all') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    query += ' ORDER BY id DESC';

    // Pagination jika ada limit
    if (limit) {
      const take = parseInt(limit) || 10;
      const skip = ((parseInt(page) || 1) - 1) * take;
      query += ' LIMIT ? OFFSET ?';
      params.push(take, skip);
    }

    const [rows] = await pool.query(query, params);

    // Ambil daftar kategori unik untuk filter
    const [kategoriRows] = await pool.query('SELECT DISTINCT kategori FROM products WHERE kategori IS NOT NULL AND kategori != ""');
    const categories = kategoriRows.map(r => r.kategori);

    return res.json({
      success: true,
      data: rows,
      categories
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data produk.'
    });
  }
};

// 2. Ambil produk berdasarkan ID (Admin & Petugas)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data produk.'
    });
  }
};

// 3. Ambil produk berdasarkan Barcode (Untuk Scanner Kasir)
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE barcode = ?', [barcode.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Produk dengan barcode '${barcode}' tidak ditemukan.`
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error in getProductByBarcode:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mencari produk berdasarkan barcode.'
    });
  }
};

// 4. Tambah produk baru (Hanya Admin)
const createProduct = async (req, res) => {
  try {
    const { barcode, nama_barang, harga, stok, kategori, satuan } = req.body;

    if (!barcode || !nama_barang || harga === undefined || stok === undefined || !kategori || !satuan) {
      return res.status(400).json({
        success: false,
        message: 'Semua kolom data produk wajib diisi lengkap.'
      });
    }

    const numericHarga = parseFloat(harga);
    const numericStok = parseInt(stok);

    if (isNaN(numericHarga) || numericHarga < 0) {
      return res.status(400).json({
        success: false,
        message: 'Harga produk harus berupa angka valid dan tidak boleh negatif.'
      });
    }

    if (isNaN(numericStok) || numericStok < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stok awal tidak boleh negatif.'
      });
    }

    // Cek barcode unik
    const [existing] = await pool.query('SELECT id FROM products WHERE barcode = ?', [barcode.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Barcode '${barcode}' sudah digunakan untuk produk lain.`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (barcode, nama_barang, harga, stok, kategori, satuan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [barcode.trim(), nama_barang.trim(), numericHarga, numericStok, kategori.trim(), satuan.trim()]
    );

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: newProduct[0]
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk baru.'
    });
  }
};

// 5. Update data produk (Hanya Admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { barcode, nama_barang, harga, stok, kategori, satuan } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    const numericHarga = parseFloat(harga);
    const numericStok = parseInt(stok);

    if (isNaN(numericHarga) || numericHarga < 0) {
      return res.status(400).json({
        success: false,
        message: 'Harga produk harus berupa angka valid dan tidak boleh bernilai minus.'
      });
    }

    if (isNaN(numericStok) || numericStok < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stok tidak boleh bernilai minus.'
      });
    }

    // Cek duplikasi barcode dengan produk lain
    if (barcode) {
      const [duplicate] = await pool.query(
        'SELECT id FROM products WHERE barcode = ? AND id != ?',
        [barcode.trim(), id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Barcode '${barcode}' telah digunakan oleh produk lain.`
        });
      }
    }

    await pool.query(
      `UPDATE products 
       SET barcode = ?, nama_barang = ?, harga = ?, stok = ?, kategori = ?, satuan = ?
       WHERE id = ?`,
      [
        barcode ? barcode.trim() : existing[0].barcode,
        nama_barang ? nama_barang.trim() : existing[0].nama_barang,
        numericHarga,
        numericStok,
        kategori ? kategori.trim() : existing[0].kategori,
        satuan ? satuan.trim() : existing[0].satuan,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Data produk berhasil diperbarui.',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data produk.'
    });
  }
};

// 6. Hapus produk (Hanya Admin)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, nama_barang FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    // Cek apakah produk sudah tercatat di transaksi sebelumnya
    const [details] = await pool.query('SELECT id FROM transaction_details WHERE product_id = ? LIMIT 1', [id]);
    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Produk '${existing[0].nama_barang}' sudah pernah masuk dalam riwayat transaksi dan tidak dapat dihapus permanen agar data keuangan tetap akurat.`
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Produk '${existing[0].nama_barang}' berhasil dihapus.`
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk.'
    });
  }
};

// 7. Update Stok Barang (Hanya Admin) - Tambah/Kurang/Set, Tidak boleh minus
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount } = req.body;

    const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    const currentProduct = productRows[0];
    const qty = parseInt(amount);

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah stok harus berupa angka positif.'
      });
    }

    let newStock = currentProduct.stok;

    if (action === 'add') {
      newStock = currentProduct.stok + qty;
    } else if (action === 'subtract') {
      newStock = currentProduct.stok - qty;
    } else if (action === 'set') {
      newStock = qty;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Aksi stok tidak valid. Gunakan "add", "subtract", atau "set".'
      });
    }

    // Validasi syarat mutlak: "Jangan sampai stok menjadi minus."
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Pengurangan stok melebihi stok yang ada. Stok saat ini (${currentProduct.stok} ${currentProduct.satuan}), tidak boleh menjadi minus!`
      });
    }

    await pool.query('UPDATE products SET stok = ? WHERE id = ?', [newStock, id]);

    return res.json({
      success: true,
      message: `Stok produk '${currentProduct.nama_barang}' berhasil diperbarui menjadi ${newStock} ${currentProduct.satuan}.`,
      data: {
        id: currentProduct.id,
        nama_barang: currentProduct.nama_barang,
        stokLama: currentProduct.stok,
        stokBaru: newStock,
        satuan: currentProduct.satuan
      }
    });
  } catch (error) {
    console.error('Error in updateStock:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui stok produk.'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
};
