/**
 * Middleware Autentikasi Bearer Token (Integrasi dengan Kelompok 2)
 * Kelompok 3 (Anisa & Saffana)
 *
 * Catatan Integrasi:
 * Modul ini menangani verifikasi Bearer Token dari Kelompok 2 (Autentikasi & Akun).
 * Saat ini menggunakan Mock Autentikasi agar dapat diuji mandiri,
 * dan dapat langsung diganti dengan JWT verify / Auth API Kelompok 2 saat integrasi tiba.
 */

require('dotenv').config();

const MOCK_TOKEN = process.env.MOCK_BEARER_TOKEN || 'token-kelompok-2-secret-2026';

/**
 * Verifikasi token autentikasi (Mock Kelompok 2)
 */
function verifyBearerToken(token) {
  // 1. Mock token dari env
  if (token === MOCK_TOKEN || token === 'mock-token-kelompok-2') {
    return {
      valid: true,
      user: {
        id: 'USR-KL2-001',
        name: 'Pengguna Kelompok 2',
        role: 'customer'
      }
    };
  }

  // 2. Jika di masa depan Kelompok 2 menggunakan format JWT asli:
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   return { valid: true, user: decoded };
  // } catch (err) {
  //   return { valid: false, error: err.message };
  // }

  return { valid: false, error: 'Token tidak cocok dengan kredensial Kelompok 2' };
}

/**
 * Middleware Express untuk Proteksi Endpoint
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses Ditolak: Header Authorization (Bearer Token) tidak ditemukan.',
      hint: 'Kirimkan header `Authorization: Bearer token-kelompok-2-secret-2026`'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Format token salah. Format yang benar: Bearer <token>'
    });
  }

  const token = parts[1];
  const authResult = verifyBearerToken(token);

  if (!authResult.valid) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi Gagal: ' + (authResult.error || 'Bearer Token tidak valid.')
    });
  }

  // Simpan data user terotentikasi ke object request
  req.user = authResult.user;
  next();
}

module.exports = authMiddleware;
