/**
 * Runner Mandiri untuk Pengujian Lengkap Endpoint Backend
 * Kelompok 3 (Anisa & Saffana)
 */

process.env.NODE_ENV = 'test';

const { server } = require('./server');
const { runTests } = require('./test-api');

// Beri jeda 1 detik agar server siap menerima koneksi
setTimeout(async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Pengujian mengalami kegagalan:', err);
  } finally {
    server.close(() => {
      console.log('Server pengujian berhasil ditutup dengan bersih.');
      process.exit(0);
    });
  }
}, 1000);
