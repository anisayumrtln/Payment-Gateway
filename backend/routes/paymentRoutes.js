/**
 * Rute API Payment Gateway Midtrans
 * Kelompok 3 (Anisa & Saffana)
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  validateMidtransTokenRequest,
  validateMidtransWebhook,
  validateOrderIdParam
} = require('../middlewares/validator');

/**
 * 1. POST /api/midtrans-token
 * Memerlukan Autentikasi Bearer Token (Kelompok 2)
 */
router.post(
  '/midtrans-token',
  authMiddleware,
  validateMidtransTokenRequest,
  paymentController.createMidtransToken
);

/**
 * 2. POST /api/midtrans-webhook
 * Dipanggil langsung oleh Midtrans Server (Memverifikasi Signature Hash SHA512)
 */
router.post(
  '/midtrans-webhook',
  validateMidtransWebhook,
  paymentController.handleMidtransWebhook
);

/**
 * 3. GET /api/payments/:order_id
 * Memerlukan Autentikasi Bearer Token (Kelompok 2)
 */
router.get(
  '/payments/:order_id',
  authMiddleware,
  validateOrderIdParam,
  paymentController.getPaymentByOrderId
);

/**
 * 4. GET /api/midtrans-client-key
 * Mendistribusikan Client Key Sandbox dari .env ke frontend secara dinamis
 */
router.get(
  '/midtrans-client-key',
  paymentController.getMidtransClientKey
);

// Alias rute tambahan untuk kompatibilitas
router.post(
  '/create-snap-token',
  authMiddleware,
  validateMidtransTokenRequest,
  paymentController.createMidtransToken
);
router.post(
  '/notification-handler',
  validateMidtransWebhook,
  paymentController.handleMidtransWebhook
);

module.exports = router;
