/**
 * Konfigurasi Midtrans Snap API (Sandbox)
 * Kelompok 3 (Anisa & Saffana)
 */

const midtransClient = require('midtrans-client');
require('dotenv').config();

// Inisialisasi Snap Client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

// Inisialisasi Core API Client (untuk cek status transaksi manual & webhook)
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

module.exports = { snap, coreApi };
