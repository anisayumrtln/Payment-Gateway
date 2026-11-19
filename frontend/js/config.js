/**
 * Konfigurasi Frontend Payment Gateway Midtrans Snap
 * Kelompok 3 (Anisa & Saffana)
 */

const CONFIG = {
  // Base URL Backend Payment Gateway Kelompok 3 (Port 5001)
  API_BASE_URL: 'http://localhost:5001/api',

  // Mock Bearer Token Integrasi Kelompok 2 (Autentikasi & Akun)
  BEARER_TOKEN: 'token-kelompok-2-secret-2026',

  // Midtrans Client Key (Sandbox Environment)
  // Sesuai akun Sandbox Midtrans Anda
  MIDTRANS_CLIENT_KEY: 'Mid-client-7fwVxW4j40g8TI10'
};

// Pastikan konfigurasi tersedia secara global
window.PAYMENT_CONFIG = CONFIG;
