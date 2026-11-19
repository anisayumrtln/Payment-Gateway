/**
 * Entry Point Server Express.js - Payment Gateway Midtrans
 * Kelompok 3 (Anisa & Saffana)
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Payment Gateway Midtrans - Kelompok 3 (Anisa & Saffana)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes Pembayaran
// Endpoint Utama:
// 1. POST /api/midtrans-token
// 2. POST /api/midtrans-webhook
// 3. GET  /api/payments/:order_id
app.use('/api', paymentRoutes);
app.use('/api/payment', paymentRoutes); // alias kompatibilitas

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server pembayaran.'
  });
});

// Menjalankan Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Payment Gateway Service Kelompok 3 (Anisa & Saffana)`);
  console.log(`📡 Server berjalan di: http://localhost:${PORT}`);
  console.log(`🔒 Mode: Midtrans Snap Sandbox`);
  console.log(`📋 Endpoint Tersedia:`);
  console.log(`   - POST http://localhost:${PORT}/api/midtrans-token`);
  console.log(`   - POST http://localhost:${PORT}/api/midtrans-webhook`);
  console.log(`   - GET  http://localhost:${PORT}/api/payments/:order_id`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
