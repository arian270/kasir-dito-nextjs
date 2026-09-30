const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kasir_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00'
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Terhubung ke database MySQL:', process.env.DB_NAME || 'kasir_db');
    connection.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke database MySQL:', error.message);
  }
}

module.exports = {
  pool,
  testConnection
};
