const { pool } = require('../config/database.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Pembuatan Akun Petugas (Khusus Admin)
const registerPetugas = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal terdiri dari 5 karakter.'
      });
    }

    // Cek apakah username sudah dipakai
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan, silakan pilih username lain.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role selalu 'petugas' untuk pendaftaran publik
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), hashedPassword, 'petugas']
    );

    return res.status(201).json({
      success: true,
      message: 'Akun petugas berhasil dibuat! Akun siap digunakan untuk login.',
      data: {
        id: result.insertId,
        username: username.trim(),
        role: 'petugas'
      }
    });
  } catch (error) {
    console.error('Error in registerPetugas:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat membuat akun petugas.'
    });
  }
};

// 2. Login (Admin dan Petugas)
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'kasir_dito_smk_pos_secret_token_2026_xyz',
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      message: `Login berhasil! Selamat datang, ${user.username}.`,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat login.'
    });
  }
};

// 3. Get profile / Current User
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil.'
    });
  }
};

module.exports = {
  registerPetugas,
  login,
  getProfile
};
