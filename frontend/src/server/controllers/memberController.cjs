const { pool } = require('../config/database.cjs');

// 1. Ambil semua member (Bisa diakses Admin & Petugas)
const getAllMembers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nama LIKE ? OR no_hp LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error in getAllMembers:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data member.'
    });
  }
};

// 2. Ambil member berdasarkan ID
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error in getMemberById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data member.'
    });
  }
};

// 3. Tambah member baru (Admin & Petugas)
const createMember = async (req, res) => {
  try {
    const { nama, no_hp, alamat } = req.body;

    if (!nama || !no_hp) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan nomor HP member wajib diisi.'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO members (nama, no_hp, alamat) VALUES (?, ?, ?)',
      [nama.trim(), no_hp.trim(), (alamat || '').trim()]
    );

    const [newMember] = await pool.query('SELECT * FROM members WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Member baru berhasil didaftarkan.',
      data: newMember[0]
    });
  } catch (error) {
    console.error('Error in createMember:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan member.'
    });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember
};
