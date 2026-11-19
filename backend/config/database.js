/**
 * Konfigurasi Koneksi Database MySQL: payments
 * Kelompok 3 (Anisa & Saffana)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'payments',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 2000 // 2 detik timeout agar cepat fallback jika DB mati
});

// Verifikasi koneksi awal secara non-blocking
let isDbConnected = false;

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database]: Berhasil terhubung ke MySQL database '${process.env.DB_NAME || 'payments'}'`);
    isDbConnected = true;
    connection.release();
  } catch (error) {
    console.warn(`[Database Warning]: Tidak dapat terhubung ke MySQL (${error.message}). Sistem beralih ke in-memory cache untuk pengujian.`);
    isDbConnected = false;
  }
})();

module.exports = {
  pool,
  isDbConnected: () => isDbConnected
};
