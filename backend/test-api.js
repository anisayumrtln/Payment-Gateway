/**
 * Script Pengujian Otomatis Seluruh Endpoint Backend Payment Gateway
 * Kelompok 3 (Anisa & Saffana)
 */

const http = require('http');
const crypto = require('crypto');
require('dotenv').config();

const BASE_HOST = '127.0.0.1';
const PORT = process.env.PORT || 5001;
const VALID_TOKEN = process.env.MOCK_BEARER_TOKEN || 'token-kelompok-2-secret-2026';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY';

function sendRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: BASE_HOST,
      port: PORT,
      path: path,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log(`\n===============================================================`);
  console.log(`MEMULAI PENGUJIAN BACKEND PAYMENT GATEWAY KELOMPOK 3`);
  console.log(`Target: http://${BASE_HOST}:${PORT}`);
  console.log(`===============================================================\n`);

  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [LULUS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [GAGAL] ${name}`);
      console.error(`   Alasan: ${err.message || err.code || JSON.stringify(err)}`);
    }
  }

  // 1. Health Check
  await assertTest('1. Health Check GET /api/health', async () => {
    const res = await sendRequest({ method: 'GET', path: '/api/health' });
    if (res.status !== 200 || res.data.status !== 'OK') {
      throw new Error(`Status bukan 200: ${JSON.stringify(res)}`);
    }
  });

  // 2. Proteksi Autentikasi Tanpa Token
  await assertTest('2. Autentikasi: Tolak request tanpa Bearer Token (POST /api/midtrans-token)', async () => {
    const res = await sendRequest({
      method: 'POST',
      path: '/api/midtrans-token',
      body: { order_id: 'ORDER-TEST-001' }
    });
    if (res.status !== 401) {
      throw new Error(`Diharapkan status 401 Unauthorized, didapat: ${res.status}`);
    }
  });

  // 3. Validasi Request: order_id kosong
  await assertTest('3. Validasi: Tolak request jika order_id tidak dikirim', async () => {
    const res = await sendRequest({
      method: 'POST',
      path: '/api/midtrans-token',
      headers: { 'Authorization': `Bearer ${VALID_TOKEN}` },
      body: {}
    });
    if (res.status !== 400) {
      throw new Error(`Diharapkan status 400 Bad Request, didapat: ${res.status}`);
    }
  });

  // 4. Sukses Membuat Snap Token (POST /api/midtrans-token)
  let generatedOrderId = 'ORDER-20261118-KL3-094';
  await assertTest('4. Fitur Utama: Berhasil membuat Snap Token (POST /api/midtrans-token)', async () => {
    const res = await sendRequest({
      method: 'POST',
      path: '/api/midtrans-token',
      headers: { 'Authorization': `Bearer ${VALID_TOKEN}` },
      body: {
        order_id: generatedOrderId,
        gross_amount: 250000
      }
    });
    if (res.status !== 201 || !res.data.data.token) {
      throw new Error(`Gagal membuat token: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ➜ Token Diterima: ${res.data.data.token.substring(0, 25)}...`);
  });

  // 5. Verifikasi Signature Webhook Ditolak (Signature Palsu)
  await assertTest('5. Keamanan Webhook: Tolak notifikasi dengan signature palsu (POST /api/midtrans-webhook)', async () => {
    const res = await sendRequest({
      method: 'POST',
      path: '/api/midtrans-webhook',
      body: {
        order_id: generatedOrderId,
        status_code: '200',
        gross_amount: '250000.00',
        signature_key: 'signature_palsu_tidak_valid',
        transaction_status: 'settlement'
      }
    });
    if (res.status !== 401) {
      throw new Error(`Diharapkan status 401 Invalid Signature, didapat: ${res.status}`);
    }
  });

  // 6. Verifikasi Signature Webhook Diterima (Signature Sah SHA512)
  await assertTest('6. Webhook Midtrans: Berhasil proses notifikasi dengan signature sah (POST /api/midtrans-webhook)', async () => {
    const statusCode = '200';
    const grossAmount = '250000.00';
    // Rumus SHA512 Midtrans
    const validSignature = crypto
      .createHash('sha512')
      .update(`${generatedOrderId}${statusCode}${grossAmount}${SERVER_KEY}`)
      .digest('hex');

    const res = await sendRequest({
      method: 'POST',
      path: '/api/midtrans-webhook',
      body: {
        order_id: generatedOrderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: 'settlement',
        payment_type: 'qris',
        transaction_id: 'TRX-MIDTRANS-TEST-9988'
      }
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Webhook gagal diproses: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ➜ Status Terverifikasi: ${res.data.data.transaction_status}`);
  });

  // 7. Cek Detail Transaksi (GET /api/payments/:order_id)
  await assertTest('7. Fitur Utama: Berhasil ambil detail pembayaran (GET /api/payments/:order_id)', async () => {
    const res = await sendRequest({
      method: 'GET',
      path: `/api/payments/${generatedOrderId}`,
      headers: { 'Authorization': `Bearer ${VALID_TOKEN}` }
    });
    if (res.status !== 200 || res.data.data.order_id !== generatedOrderId) {
      throw new Error(`Data tidak sesuai: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ➜ Data Transaksi: Order ID=${res.data.data.order_id}, Status=${res.data.data.transaction_status}, Metode=${res.data.data.payment_type}`);
  });

  // 8. Cek Konfigurasi Client Key untuk Frontend (GET /api/midtrans-client-key)
  await assertTest('8. Konfigurasi: Client Key tersedia untuk frontend (GET /api/midtrans-client-key)', async () => {
    const res = await sendRequest({
      method: 'GET',
      path: '/api/midtrans-client-key'
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Endpoint Client Key gagal diakses: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ➜ Endpoint Client Key OK (Sandbox: ${!res.data.is_production})`);
  });

  console.log(`\n===============================================================`);
  console.log(`HASIL PENGUJIAN: ${passed} dari ${total} Pengujian Berhasil Dilalui!`);
  console.log(`===============================================================\n`);
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch(console.error);
}
