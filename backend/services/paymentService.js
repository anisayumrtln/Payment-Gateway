/**
 * Service Database Pembayaran (Tabel: payments)
 * Kelompok 3 (Anisa & Saffana)
 */

const { pool, isDbConnected } = require('../config/database');

// In-Memory Fallback Cache untuk testing saat server MySQL belum dinyalakan
const memoryStore = new Map();

/**
 * Menyimpan data inisiasi transaksi Snap ke database payments
 */
async function saveSnapTransaction(data) {
  const {
    order_id,
    gross_amount,
    snap_token,
    customer_name,
    customer_email,
    customer_phone
  } = data;

  const record = {
    order_id,
    transaction_id: null,
    gross_amount: Number(gross_amount),
    payment_type: null,
    transaction_status: 'pending',
    fraud_status: null,
    snap_token,
    customer_name: customer_name || 'Pelanggan',
    customer_email: customer_email || 'customer@example.com',
    customer_phone: customer_phone || null,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Simpan ke in-memory cache
  memoryStore.set(order_id, record);

  // Jika koneksi MySQL aktif, simpan ke database payments
  if (isDbConnected()) {
    try {
      const query = `
        INSERT INTO payments 
          (order_id, gross_amount, transaction_status, snap_token, customer_name, customer_email, customer_phone)
        VALUES (?, ?, 'pending', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          snap_token = VALUES(snap_token),
          gross_amount = VALUES(gross_amount),
          updated_at = NOW()
      `;
      await pool.query(query, [
        order_id,
        gross_amount,
        snap_token,
        customer_name,
        customer_email,
        customer_phone
      ]);
    } catch (err) {
      console.warn('[DB Error] Gagal simpan ke MySQL:', err.message);
    }
  }

  return record;
}

/**
 * Mengupdate data transaksi dari Webhook Midtrans
 */
async function updateTransactionFromWebhook(webhookData) {
  const {
    order_id,
    transaction_id,
    payment_type,
    transaction_status,
    fraud_status,
    signature_key,
    settlement_time,
    transaction_time
  } = webhookData;

  const paymentTime = settlement_time || transaction_time || new Date();

  // Update ke in-memory cache
  const existing = memoryStore.get(order_id) || { order_id };
  const updated = {
    ...existing,
    transaction_id: transaction_id || existing.transaction_id,
    payment_type: payment_type || existing.payment_type,
    transaction_status: transaction_status,
    fraud_status: fraud_status || null,
    signature_key: signature_key,
    payment_time: paymentTime,
    updated_at: new Date()
  };
  memoryStore.set(order_id, updated);

  // Update ke MySQL database payments jika koneksi aktif
  if (isDbConnected()) {
    try {
      const query = `
        UPDATE payments 
        SET 
          transaction_id = ?,
          payment_type = ?,
          transaction_status = ?,
          fraud_status = ?,
          signature_key = ?,
          payment_time = ?,
          raw_response = ?,
          updated_at = NOW()
        WHERE order_id = ?
      `;
      await pool.query(query, [
        transaction_id || null,
        payment_type || null,
        transaction_status,
        fraud_status || null,
        signature_key || null,
        paymentTime ? new Date(paymentTime) : new Date(),
        JSON.stringify(webhookData),
        order_id
      ]);

      // Catat juga ke payment_logs
      await pool.query(
        `INSERT INTO payment_logs (order_id, status_code, transaction_status, raw_payload) VALUES (?, ?, ?, ?)`,
        [order_id, webhookData.status_code || null, transaction_status, JSON.stringify(webhookData)]
      );
    } catch (err) {
      console.warn('[DB Error] Gagal update transaksi di MySQL:', err.message);
    }
  }

  return updated;
}

/**
 * Mengambil data pembayaran berdasarkan order_id
 */
async function getPaymentByOrderId(orderId) {
  // 1. Coba dari MySQL jika aktif
  if (isDbConnected()) {
    try {
      const [rows] = await pool.query(`SELECT * FROM payments WHERE order_id = ? LIMIT 1`, [orderId]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[DB Error] Gagal query MySQL:', err.message);
    }
  }

  // 2. Ambil dari in-memory cache
  if (memoryStore.has(orderId)) {
    return memoryStore.get(orderId);
  }

  return null;
}

module.exports = {
  saveSnapTransaction,
  updateTransactionFromWebhook,
  getPaymentByOrderId,
  memoryStore
};
