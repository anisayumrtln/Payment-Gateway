/**
 * Frontend Logic Payment Gateway Midtrans Snap Checkout
 * Kelompok 3 (Anisa & Saffana)
 */

(function () {
  'use strict';

  // Helper untuk membuat ID Pesanan unik agar tidak terjadi duplikasi di Midtrans
  function generateUniqueOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    return `ORDER-KL3-${timestamp}`;
  }

  // Data Pesanan Sementara (Mock Data untuk Pengujian Kelompok 3)
  const currentOrder = {
    orderId: generateUniqueOrderId(),
    grossAmount: 250000,
    customerDetails: {
      firstName: 'Ahmad',
      lastName: 'Fauzi',
      email: 'ahmad.fauzi@example.com',
      phone: '081234567890'
    },
    items: [
      {
        id: 'MODUL-01',
        name: 'Modul Pembelajaran Fullstack Web',
        price: 195000,
        quantity: 1
      },
      {
        id: 'CERT-02',
        name: 'Sertifikat Digital & Lisensi API',
        price: 50000,
        quantity: 1
      }
    ],
    serviceFee: 5000
  };

  // DOM Elements
  const btnPayNow = document.getElementById('btnPayNow');
  const paySpinner = document.getElementById('paySpinner');
  const payBtnLabel = document.getElementById('payBtnLabel');
  const btnCopyOrderId = document.getElementById('btnCopyOrderId');
  const orderIdText = document.getElementById('orderIdText');
  
  const checkoutSection = document.getElementById('checkoutSection');
  const pageIntro = document.getElementById('pageIntro');
  const statusContainer = document.getElementById('statusContainer');
  const statusIconWrapper = document.getElementById('statusIconWrapper');
  const statusTitle = document.getElementById('statusTitle');
  const statusDescription = document.getElementById('statusDescription');
  const statusOrderId = document.getElementById('statusOrderId');
  const statusAmount = document.getElementById('statusAmount');
  const statusPaymentType = document.getElementById('statusPaymentType');
  const statusTime = document.getElementById('statusTime');
  const statusDatabaseTag = document.getElementById('statusDatabaseTag');
  const btnBackToCheckout = document.getElementById('btnBackToCheckout');
  const btnSyncDbStatus = document.getElementById('btnSyncDbStatus');
  const btnStatusAction = document.getElementById('btnStatusAction');

  const backendStatusBadge = document.getElementById('backendStatusBadge');
  const backendDot = document.getElementById('backendDot');
  const backendStatusText = document.getElementById('backendStatusText');

  // Inisialisasi Tampilan Order ID
  if (orderIdText) {
    orderIdText.innerText = currentOrder.orderId;
  }

  /**
   * Format angka menjadi Rupiah Indonesia
   */
  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Sinkronisasi Client Key dari backend (.env) atau config.js ke Snap.js
   */
  async function setupSnapClientKey() {
    const config = window.PAYMENT_CONFIG || {};
    let clientKey = config.MIDTRANS_CLIENT_KEY;

    // Coba ambil Client Key dari endpoint backend agar otomatis membaca file backend/.env
    try {
      const res = await fetch(`${config.API_BASE_URL || 'http://localhost:5001/api'}/midtrans-client-key`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.client_key && !data.client_key.includes('YOUR_CLIENT_KEY')) {
          clientKey = data.client_key;
          config.MIDTRANS_CLIENT_KEY = clientKey;
          console.log('[Midtrans Snap] Client Key berhasil dimuat dari backend/.env:', clientKey);
        }
      }
    } catch (e) {
      console.warn('[Midtrans Config]: Menggunakan konfigurasi lokal di js/config.js');
    }

    const snapScript = document.getElementById('midtransSnapScript');
    if (snapScript && clientKey) {
      snapScript.setAttribute('data-client-key', clientKey);
    }
  }

  /**
   * Cek Status Koneksi Server Backend saat Halaman Dimuat
   */
  async function checkBackendConnection() {
    const config = window.PAYMENT_CONFIG || {};
    const baseUrl = config.API_BASE_URL || 'http://localhost:5001/api';

    try {
      const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
      if (res.ok) {
        if (backendStatusBadge) {
          backendStatusBadge.style.backgroundColor = '#ecfdf5';
          backendStatusBadge.style.color = '#065f46';
          backendStatusBadge.style.borderColor = '#a7f3d0';
        }
        if (backendDot) backendDot.style.backgroundColor = '#10b981';
        if (backendStatusText) backendStatusText.innerText = 'Backend Terhubung (Port 5001)';
        return true;
      }
    } catch (e) {
      if (backendStatusBadge) {
        backendStatusBadge.style.backgroundColor = '#fef2f2';
        backendStatusBadge.style.color = '#991b1b';
        backendStatusBadge.style.borderColor = '#fecaca';
      }
      if (backendDot) backendDot.style.backgroundColor = '#ef4444';
      if (backendStatusText) backendStatusText.innerText = 'Backend Offline (Nyalakan Port 5001)';
      return false;
    }
    return false;
  }

  /**
   * Salin Order ID ke Clipboard
   */
  if (btnCopyOrderId) {
    btnCopyOrderId.addEventListener('click', function () {
      const id = currentOrder.orderId;
      navigator.clipboard.writeText(id).then(function () {
        alert('Nomor Pesanan ' + id + ' berhasil disalin!');
      }).catch(function () {
        prompt('Salin Nomor Pesanan:', id);
      });
    });
  }

  /**
   * Ubah Status Visual Tombol Bayar (Loading / Normal)
   */
  function setLoadingState(isLoading) {
    if (isLoading) {
      btnPayNow.disabled = true;
      paySpinner.style.display = 'inline-block';
      payBtnLabel.innerText = 'Meminta Snap Token...';
    } else {
      btnPayNow.disabled = false;
      paySpinner.style.display = 'none';
      payBtnLabel.innerText = 'Bayar Sekarang • ' + formatRupiah(currentOrder.grossAmount);
    }
  }

  /**
   * Meminta Snap Token ke Backend via POST /api/midtrans-token
   */
  async function requestSnapToken() {
    const config = window.PAYMENT_CONFIG || {};
    const apiUrl = (config.API_BASE_URL || 'http://localhost:5001/api') + '/midtrans-token';
    const bearerToken = config.BEARER_TOKEN || 'token-kelompok-2-secret-2026';

    const payload = {
      order_id: currentOrder.orderId,
      gross_amount: currentOrder.grossAmount,
      customer_details: {
        first_name: currentOrder.customerDetails.firstName,
        last_name: currentOrder.customerDetails.lastName,
        email: currentOrder.customerDetails.email,
        phone: currentOrder.customerDetails.phone
      },
      item_details: [
        ...currentOrder.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        {
          id: 'FEE-01',
          name: 'Biaya Layanan & Transaksi',
          price: currentOrder.serviceFee,
          quantity: 1
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Gagal menghubungi server (Status: ${response.status})`);
    }

    return data;
  }

  /**
   * Mengambil Status Transaksi Terverifikasi dari Database Backend
   * Endpoint: GET /api/payments/:order_id
   */
  async function fetchPaymentFromDb(orderId) {
    const config = window.PAYMENT_CONFIG || {};
    const apiUrl = `${config.API_BASE_URL || 'http://localhost:5001/api'}/payments/${orderId}`;
    const bearerToken = config.BEARER_TOKEN || 'token-kelompok-2-secret-2026';

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (e) {
      console.warn('[Fetch DB Error]:', e.message);
    }
    return null;
  }

  /**
   * Alur Utama: Tombol "Bayar Sekarang" Ditekan
   * Menampilkan Popup Resmi Midtrans Snap Checkout
   */
  async function handlePayment() {
    setLoadingState(true);

    try {
      // 1. Dapatkan Snap Token dari Backend
      const result = await requestSnapToken();

      if (!result || !result.data || !result.data.token) {
        throw new Error('Token pembayaran tidak diterima dari server backend.');
      }

      const snapToken = result.data.token;
      console.log('[Midtrans Snap] Snap Token Diterima:', snapToken);

      // 2. Periksa ketersediaan SDK Snap.js di browser
      if (typeof window.snap === 'undefined' || typeof window.snap.pay !== 'function') {
        throw new Error(
          'SDK Midtrans Snap.js belum termuat. Periksa koneksi internet ke https://app.sandbox.midtrans.com/snap/snap.js'
        );
      }

      // 3. Tampilkan Popup Resmi Midtrans Snap Checkout dengan seluruh metode pembayaran Sandbox
      window.snap.pay(snapToken, {
        // Callback Saat Pembayaran Sukses (Settlement / Capture)
        onSuccess: async function (snapResult) {
          console.log('[Midtrans Snap] Transaksi Berhasil (onSuccess):', snapResult);
          const dbRecord = await fetchPaymentFromDb(currentOrder.orderId);
          showStatus('success', snapResult, dbRecord);
        },

        // Callback Saat Pembayaran Menunggu (Pending / VA / QRIS)
        onPending: async function (snapResult) {
          console.log('[Midtrans Snap] Transaksi Menunggu Pembayaran (onPending):', snapResult);
          const dbRecord = await fetchPaymentFromDb(currentOrder.orderId);
          showStatus('pending', snapResult, dbRecord);
        },

        // Callback Saat Pembayaran Mengalami Error / Gagal
        onError: async function (snapResult) {
          console.error('[Midtrans Snap] Transaksi Gagal (onError):', snapResult);
          const dbRecord = await fetchPaymentFromDb(currentOrder.orderId);
          showStatus('failed', snapResult, dbRecord);
        },

        // Callback Saat Pengguna Menutup Jendela Popup
        onClose: function () {
          console.log('[Midtrans Snap] Pengguna menutup popup pembayaran sebelum transaksi selesai.');
          setLoadingState(false);
          alert('Popup pembayaran Midtrans ditutup sebelum transaksi diselesaikan.');
        }
      });

    } catch (err) {
      console.error('[Payment Error]:', err.message);
      let userMsg = err.message;
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('koneksi')) {
        userMsg = 'Server Backend belum aktif di port 5001!\n\nSilakan jalankan server backend terlebih dahulu dengan perintah:\ncd d:\\Payment_Gateway\\backend\nnpm start';
      } else if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        userMsg = 'Kunci MIDTRANS_SERVER_KEY di backend/.env ditolak oleh Midtrans (401 Unauthorized)!\n\nNilai di baris 11 backend/.env saat ini masih tertulis nama label "PAYMENT_GATEWAY".\nSilakan salin Server Key asli (Signature Secret Key) dari dashboard Midtrans Sandbox Anda dan tempel di baris 11 file backend/.env.';
      }
      alert('Kendala Pembayaran:\n\n' + userMsg);
      setLoadingState(false);
    }
  }

  /**
   * Menampilkan Layar Status Transaksi (Berhasil, Pending, Gagal)
   */
  async function showStatus(statusType, snapDetail = null, dbDetail = null) {
    setLoadingState(false);

    // Sembunyikan checkout form
    checkoutSection.style.display = 'none';
    if (pageIntro) pageIntro.style.display = 'none';

    // Reset container status
    statusContainer.className = 'status-container';
    statusContainer.style.display = 'block';

    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    statusOrderId.innerText = (snapDetail && (snapDetail.order_id || snapDetail.orderId)) || currentOrder.orderId;
    statusAmount.innerText = formatRupiah((snapDetail && (snapDetail.gross_amount || snapDetail.grossAmount)) || currentOrder.grossAmount);
    statusTime.innerText = formattedDate;

    // Tampilkan Metode Pembayaran dari Hasil Midtrans
    const paymentType = (snapDetail && snapDetail.payment_type) || (dbDetail && dbDetail.payment_type) || 'Midtrans Snap';
    statusPaymentType.innerText = paymentType.toUpperCase();

    // Tampilkan Status Terverifikasi dari Database
    const dbStatus = (dbDetail && dbDetail.transaction_status) || (statusType === 'success' ? 'settlement' : (statusType === 'pending' ? 'pending' : 'failed'));
    statusDatabaseTag.innerText = `STATUS DB: ${dbStatus.toUpperCase()}`;

    if (statusType === 'success') {
      statusContainer.classList.add('status-success');
      statusIconWrapper.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      statusTitle.innerText = 'Pembayaran Berhasil!';
      statusDescription.innerText = 'Transaksi Anda telah sukses dikonfirmasi oleh sistem Midtrans. Notifikasi status dan riwayat pembayaran tersimpan rapi di database.';
      statusDatabaseTag.style.color = '#10b981';

      btnStatusAction.innerText = 'Cetak Bukti Transaksi';
      btnStatusAction.onclick = function () {
        window.print();
      };

    } else if (statusType === 'pending') {
      statusContainer.classList.add('status-pending');
      statusIconWrapper.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      `;
      statusTitle.innerText = 'Menunggu Pembayaran';
      statusDescription.innerText = 'Selesaikan pembayaran sesuai instruksi Virtual Account atau QRIS pada Midtrans sebelum batas waktu berakhir.';
      statusDatabaseTag.style.color = '#f59e0b';

      btnStatusAction.innerText = 'Cek Status Pembayaran';
      btnStatusAction.onclick = function () {
        syncDbStatus();
      };

    } else if (statusType === 'failed') {
      statusContainer.classList.add('status-failed');
      statusIconWrapper.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      statusTitle.innerText = 'Pembayaran Gagal / Dibatalkan';
      statusDescription.innerText = 'Transaksi tidak berhasil atau telah kedaluwarsa. Saldo Anda tidak terpotong. Silakan coba kembali dengan metode lain.';
      statusDatabaseTag.style.color = '#ef4444';

      btnStatusAction.innerText = 'Coba Bayar Lagi';
      btnStatusAction.onclick = function () {
        resetToCheckout();
      };
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Pengecekan Ulang Status ke Database Backend
   */
  async function syncDbStatus() {
    if (btnSyncDbStatus) btnSyncDbStatus.innerText = 'Memeriksa DB...';
    const dbData = await fetchPaymentFromDb(currentOrder.orderId);
    if (dbData) {
      alert(
        `Hasil Pengecekan Database 'payments':\n\n` +
        `• Order ID: ${dbData.order_id}\n` +
        `• Status Transaksi: ${dbData.transaction_status}\n` +
        `• Total Tagihan: ${formatRupiah(dbData.gross_amount)}\n` +
        `• Metode Bayar: ${dbData.payment_type || 'Belum dipilih'}\n` +
        `• Waktu Update: ${dbData.updated_at || '-'}`
      );
      if (statusDatabaseTag) {
        statusDatabaseTag.innerText = `STATUS DB: ${dbData.transaction_status.toUpperCase()}`;
      }
    } else {
      alert(`Belum ada data untuk pesanan ${currentOrder.orderId} di database.`);
    }
    if (btnSyncDbStatus) btnSyncDbStatus.innerText = '↺ Cek Database Terkini';
  }

  /**
   * Reset Form untuk Transaksi Baru
   */
  function resetToCheckout() {
    // Generate Order ID baru agar Midtrans tidak menolak order_id lama
    currentOrder.orderId = generateUniqueOrderId();
    if (orderIdText) orderIdText.innerText = currentOrder.orderId;

    statusContainer.style.display = 'none';
    checkoutSection.style.display = 'grid';
    if (pageIntro) pageIntro.style.display = 'block';
    setLoadingState(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Event Listeners
  if (btnPayNow) {
    btnPayNow.addEventListener('click', handlePayment);
  }

  if (btnBackToCheckout) {
    btnBackToCheckout.addEventListener('click', resetToCheckout);
  }

  if (btnSyncDbStatus) {
    btnSyncDbStatus.addEventListener('click', syncDbStatus);
  }

  // Inisialisasi saat halaman pertama kali dibuka
  setupSnapClientKey();
  checkBackendConnection();

  // Expose untuk debugging konsol browser
  window.PaymentApp = {
    currentOrder: currentOrder,
    handlePayment: handlePayment,
    resetToCheckout: resetToCheckout,
    syncDbStatus: syncDbStatus
  };

})();
