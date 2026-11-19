/**
 * Request Validation Middleware
 * Kelompok 3 (Anisa & Saffana)
 */

/**
 * Validasi Request Body untuk POST /api/midtrans-token
 */
function validateMidtransTokenRequest(req, res, next) {
  const { order_id, gross_amount, customer_details, item_details } = req.body;

  const errors = [];

  // order_id wajib ada dan berupa string
  if (!order_id || typeof order_id !== 'string' || order_id.trim() === '') {
    errors.push('Field `order_id` wajib diisi (string tidak boleh kosong).');
  }

  // Jika gross_amount dikirim langsung, harus bernilai angka positif > 0
  if (gross_amount !== undefined) {
    const amount = Number(gross_amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Field `gross_amount` harus berupa angka positif lebih dari 0.');
    }
  }

  // Jika customer_details dikirim, email harus valid (opsional)
  if (customer_details && customer_details.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_details.email)) {
      errors.push('Format `customer_details.email` tidak valid.');
    }
  }

  // Jika item_details dikirim, harus berupa array
  if (item_details !== undefined && !Array.isArray(item_details)) {
    errors.push('Field `item_details` harus berupa array item.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi request gagal.',
      errors: errors
    });
  }

  next();
}

/**
 * Validasi Request Body untuk POST /api/midtrans-webhook
 */
function validateMidtransWebhook(req, res, next) {
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = req.body;

  const missingFields = [];
  if (!order_id) missingFields.push('order_id');
  if (!status_code) missingFields.push('status_code');
  if (!gross_amount) missingFields.push('gross_amount');
  if (!signature_key) missingFields.push('signature_key');
  if (!transaction_status) missingFields.push('transaction_status');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Payload webhook Midtrans tidak lengkap.',
      missing_fields: missingFields
    });
  }

  next();
}

/**
 * Validasi Parameter URL untuk GET /api/payments/:order_id
 */
function validateOrderIdParam(req, res, next) {
  const { order_id } = req.params;

  if (!order_id || order_id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Parameter `order_id` di URL wajib diisi.'
    });
  }

  next();
}

module.exports = {
  validateMidtransTokenRequest,
  validateMidtransWebhook,
  validateOrderIdParam
};
