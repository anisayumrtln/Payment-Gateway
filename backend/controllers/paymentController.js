/**
 * Controller Logika Payment Gateway Midtrans Snap & Core API
 * Kelompok 3 (Anisa & Saffana)
 */

const kelompok1Service = require('../services/kelompok1Service');
const midtransService = require('../services/midtransService');
const paymentService = require('../services/paymentService');

/**
 * 1. Endpoint: POST /api/midtrans-token
 * Membuat Midtrans Snap Token dengan seluruh metode pembayaran yang tersedia
 */
exports.createMidtransToken = async (req, res, next) => {
  try {
    const { order_id, gross_amount, customer_details, item_details } = req.body;

    // Ambil detail pesanan dari Kelompok 1 (Mock / Service)
    const orderFromKelompok1 = await kelompok1Service.getOrderDetails(order_id);

    // Prioritaskan data yang dikirim di body, fallback ke data Kelompok 1
    const finalAmount = Number(gross_amount || orderFromKelompok1.gross_amount);
    const finalCustomer = customer_details || orderFromKelompok1.customer_details;
    const finalItems = item_details || orderFromKelompok1.item_details;

    // Parameter transaksi resmi Midtrans Snap Sandbox
    // Mengaktifkan seluruh metode pembayaran Sandbox:
    // QRIS, GoPay, ShopeePay, DANA (via QRIS), VA BCA, Mandiri, BNI, BRI, Permata, Kartu Kredit, Indomaret & Alfamart
    const transactionParams = {
      transaction_details: {
        order_id: order_id,
        gross_amount: finalAmount
      },
      customer_details: finalCustomer,
      item_details: finalItems,
      enabled_payments: [
        "credit_card",
        "bca_va",
        "bni_va",
        "bri_va",
        "echannel",       // Mandiri Bill Payment / VA
        "permata_va",
        "other_va",
        "gopay",
        "shopeepay",
        "other_qris",     // QRIS (Mendukung DANA, OVO, GoPay, ShopeePay, BCA, dll.)
        "indomaret",
        "alfamart"
      ],
      credit_card: {
        secure: true
      }
    };

    // Buat token melalui service Midtrans Snap Sandbox
    const snapResult = await midtransService.createSnapToken(transactionParams);

    // Simpan data inisiasi transaksi ke database payments
    await paymentService.saveSnapTransaction({
      order_id: order_id,
      gross_amount: finalAmount,
      snap_token: snapResult.token,
      customer_name: `${finalCustomer.first_name || ''} ${finalCustomer.last_name || ''}`.trim(),
      customer_email: finalCustomer.email,
      customer_phone: finalCustomer.phone
    });

    return res.status(201).json({
      success: true,
      message: 'Midtrans Snap Token berhasil dibuat',
      data: {
        order_id: order_id,
        gross_amount: finalAmount,
        token: snapResult.token,
        redirect_url: snapResult.redirect_url
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * 2. Endpoint: POST /api/midtrans-webhook
 * Menerima notifikasi HTTP / Webhook dari Midtrans Server
 */
exports.handleMidtransWebhook = async (req, res, next) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      settlement_time,
      transaction_time
    } = req.body;

    // 1. Verifikasi Keaslian Signature Webhook Midtrans (SHA512)
    const isSignatureValid = midtransService.verifyWebhookSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isSignatureValid) {
      console.warn(`[Webhook Blocked] Signature key tidak valid untuk order_id: ${order_id}`);
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak: Signature key tidak valid atau tidak cocok dengan Server Key.'
      });
    }

    // 2. Pemetaan status transaksi Midtrans ke status aplikasi
    let mappedStatus = 'pending';
    if (transaction_status === 'capture') {
      mappedStatus = fraud_status === 'accept' ? 'success' : 'challenge';
    } else if (transaction_status === 'settlement') {
      mappedStatus = 'success';
    } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
      mappedStatus = 'failed';
    } else if (transaction_status === 'pending') {
      mappedStatus = 'pending';
    }

    // 3. Update data transaksi di tabel payments
    const updatedPayment = await paymentService.updateTransactionFromWebhook({
      order_id,
      transaction_id,
      payment_type,
      transaction_status: mappedStatus,
      fraud_status,
      signature_key,
      settlement_time,
      transaction_time,
      status_code
    });

    console.log(`[Midtrans Webhook Terverifikasi]: Order ${order_id} berhasil diupdate ke status: ${mappedStatus}`);

    return res.status(200).json({
      success: true,
      message: 'Notifikasi webhook Midtrans berhasil diproses',
      data: {
        order_id: order_id,
        transaction_status: mappedStatus,
        payment_type: payment_type
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * 3. Endpoint: GET /api/payments/:order_id
 * Mengambil informasi detail transaksi pembayaran (dengan sinkronisasi Midtrans Core API)
 */
exports.getPaymentByOrderId = async (req, res, next) => {
  try {
    const { order_id } = req.params;

    // 1. Ambil dari database payments
    let payment = await paymentService.getPaymentByOrderId(order_id);

    // 2. Sinkronisasi status terkini langsung ke Midtrans API jika status di DB masih pending
    if (payment && payment.transaction_status === 'pending') {
      const midtransStatus = await midtransService.checkTransactionStatus(order_id);
      if (midtransStatus && midtransStatus.transaction_status) {
        let mappedStatus = midtransStatus.transaction_status;
        if (mappedStatus === 'settlement' || (mappedStatus === 'capture' && midtransStatus.fraud_status === 'accept')) {
          mappedStatus = 'success';
        } else if (['deny', 'cancel', 'expire', 'failure'].includes(mappedStatus)) {
          mappedStatus = 'failed';
        }

        if (mappedStatus !== payment.transaction_status) {
          payment = await paymentService.updateTransactionFromWebhook({
            order_id: order_id,
            transaction_id: midtransStatus.transaction_id,
            payment_type: midtransStatus.payment_type,
            transaction_status: mappedStatus,
            fraud_status: midtransStatus.fraud_status,
            signature_key: midtransStatus.signature_key,
            settlement_time: midtransStatus.settlement_time,
            transaction_time: midtransStatus.transaction_time,
            status_code: midtransStatus.status_code
          });
        }
      }
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Data transaksi untuk order_id '${order_id}' tidak ditemukan di database payments.`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: payment.id || null,
        order_id: payment.order_id,
        transaction_id: payment.transaction_id || null,
        gross_amount: Number(payment.gross_amount),
        payment_type: payment.payment_type || 'Belum dipilih',
        transaction_status: payment.transaction_status || 'pending',
        customer_name: payment.customer_name || null,
        customer_email: payment.customer_email || null,
        payment_time: payment.payment_time || null,
        updated_at: payment.updated_at
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * 4. Endpoint: GET /api/midtrans-client-key
 * Menyediakan Client Key Midtrans Sandbox ke Frontend secara aman (berdasarkan .env)
 * Tanpa mengekspos Server Key!
 */
exports.getMidtransClientKey = (req, res) => {
  return res.status(200).json({
    success: true,
    client_key: process.env.MIDTRANS_CLIENT_KEY || '',
    is_production: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  });
};
