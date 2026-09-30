const { pool } = require('../config/database.cjs');

// Laporan Transaksi Lengkap (Admin & Petugas)
const getReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    let filterCondition = '1=1';
    const params = [];

    if (period === 'today') {
      filterCondition = 'DATE(t.tanggal_transaksi) = CURDATE()';
    } else if (period === 'this_week') {
      filterCondition = 'YEARWEEK(t.tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'this_month') {
      filterCondition = 'MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
    } else if (period === 'custom' && startDate && endDate) {
      filterCondition = 'DATE(t.tanggal_transaksi) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // 1. Data Ringkasan (Summary)
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT t.id) AS total_transaksi,
        COALESCE(SUM(t.total), 0) AS total_pendapatan,
        COALESCE(SUM(td.jumlah), 0) AS total_barang_terjual,
        COALESCE(AVG(t.total), 0) AS rata_rata_transaksi
      FROM transactions t
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE ${filterCondition}
    `;

    const [summaryRows] = await pool.query(summaryQuery, params);
    const summary = summaryRows[0] || {
      total_transaksi: 0,
      total_pendapatan: 0,
      total_barang_terjual: 0,
      rata_rata_transaksi: 0
    };

    // 2. Daftar Transaksi
    const listQuery = `
      SELECT 
        t.id,
        t.nomor_transaksi,
        t.total,
        t.bayar,
        t.kembalian,
        t.tanggal_transaksi,
        u.username AS petugas,
        COALESCE(m.nama, 'Pelanggan Umum') AS nama_member,
        COALESCE(m.no_hp, '-') AS no_hp_member,
        'Lunas (Tunai)' AS status_pembayaran,
        COUNT(td.id) AS jumlah_jenis_barang,
        COALESCE(SUM(td.jumlah), 0) AS total_qty
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE ${filterCondition}
      GROUP BY t.id
      ORDER BY t.tanggal_transaksi DESC
    `;

    const [transactions] = await pool.query(listQuery, params);

    // 3. Produk Terlaris (Top Selling) pada periode tersebut
    const topProductsQuery = `
      SELECT 
        p.nama_barang,
        p.kategori,
        SUM(td.jumlah) AS terjual,
        SUM(td.subtotal) AS total_omset
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      JOIN products p ON td.product_id = p.id
      WHERE ${filterCondition}
      GROUP BY p.id
      ORDER BY terjual DESC
      LIMIT 5
    `;

    const [topProducts] = await pool.query(topProductsQuery, params);

    return res.json({
      success: true,
      data: {
        filter: {
          period: period || 'all',
          startDate: startDate || null,
          endDate: endDate || null
        },
        summary: {
          total_transaksi: parseInt(summary.total_transaksi) || 0,
          total_pendapatan: parseFloat(summary.total_pendapatan) || 0,
          total_barang_terjual: parseInt(summary.total_barang_terjual) || 0,
          rata_rata_transaksi: parseFloat(summary.rata_rata_transaksi) || 0
        },
        transactions,
        topProducts
      }
    });

  } catch (error) {
    console.error('Error in getReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghasilkan laporan transaksi.'
    });
  }
};

module.exports = {
  getReport
};
