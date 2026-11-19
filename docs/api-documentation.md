# Dokumentasi API & Panduan Integrasi Antar Kelompok
**Project: Payment Gateway Midtrans (Kelompok 3 - Anisa & Saffana)**

Dokumen ini disusun sebagai kontrak integrasi resmi modul pembayaran bagi:
1. **Kelompok 1 (Katalog, Keranjang & Manajemen Order)**
2. **Kelompok 2 (Manajemen Akun & Autentikasi User)**
3. **Kelompok 5 (Frontend Website Utama / Halaman Checkout)**

---

## 📌 Ikhtisar Layanan (Overview)
- **Base URL Service**: `http://localhost:5001/api`
- **Lingkungan**: Midtrans Snap Sandbox Environment
- **Format Pertukaran Data**: JSON (RFC 8259)
- **File Postman Collection**: Tersedia di [payment-gateway-kelompok-3.postman_collection.json](file:///d:/Payment_Gateway/docs/payment-gateway-kelompok-3.postman_collection.json)

---

## 🗂️ 1. Panduan Khusus Kelompok 1 (Order & Keranjang)

Kelompok 1 bertugas mengelola katalog dan membuat ID Pesanan (`order_id`) saat pengguna melakukan checkout.

### Alur Integrasi:
1. Pengguna menyelesaikan pemilihan produk di keranjang.
2. Server Kelompok 1 membuat `order_id` dan total nominal (`gross_amount`).
3. Kelompok 1 memanggil `POST /api/midtrans-token` untuk mendapatkan token transaksi Midtrans Snap.
4. Token tersebut kemudian diberikan kepada frontend (Kelompok 5) untuk menampilkan pop-up pembayaran.

### Spesifikasi Endpoint: `POST /api/midtrans-token`
- **URL**: `http://localhost:5001/api/midtrans-token`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN_DARI_KELOMPOK_2>
  Content-Type: application/json
  ```
- **Payload Request**:
  ```json
  {
    "order_id": "ORDER-20261118-KL3-094",
    "gross_amount": 250000,
    "customer_details": {
      "first_name": "Ahmad",
      "last_name": "Fauzi",
      "email": "ahmad.fauzi@example.com",
      "phone": "081234567890"
    },
    "item_details": [
      {
        "id": "PROD-01",
        "name": "Modul Pembelajaran Fullstack Web",
        "price": 195000,
        "quantity": 1
      },
      {
        "id": "FEE-01",
        "name": "Biaya Layanan & Transaksi",
        "price": 5000,
        "quantity": 1
      }
    ]
  }
  ```
- **Response Success (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Midtrans Snap Token berhasil dibuat",
    "data": {
      "order_id": "ORDER-20261118-KL3-094",
      "gross_amount": 250000,
      "token": "472b5f7e-c802-4b72-b2ee-66e8574d5389",
      "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/472b5f7e-c802-4b72-b2ee-66e8574d5389"
    }
  }
  ```

---

## 🔑 2. Panduan Khusus Kelompok 2 (User & Autentikasi)

Kelompok 2 bertugas menyediakan mekanisme autentikasi dan otorisasi pengguna.

### Mekanisme Bearer Token:
- Seluruh endpoint pembayaran privat (`POST /api/midtrans-token` dan `GET /api/payments/:order_id`) mewajibkan header:
  ```http
  Authorization: Bearer <JWT_ATAU_MOCK_TOKEN>
  ```
- **Kredensial Pengujian (Mock Auth)**:
  Saat integrasi lokal, gunakan nilai default:
  ```
  Authorization: Bearer token-kelompok-2-secret-2026
  ```
- **Integrasi Produksi**:
  Saat sistem Kelompok 2 siap, modul pembayaran telah menyiapkan fungsi modular di:
  [backend/middlewares/authMiddleware.js](file:///d:/Payment_Gateway/backend/middlewares/authMiddleware.js).
  Kelompok 2 cukup memberikan fungsi verifikasi JWT atau secret key `JWT_SECRET` yang dapat dimasukkan ke file `.env`.

---

## 💻 3. Panduan Khusus Kelompok 5 (Frontend Website Utama)

Kelompok 5 bertugas menyematkan alur pembayaran ke dalam antarmuka checkout website.

### Langkah-langkah Integrasi Frontend:
1. **Sematkan Script Midtrans Snap.js** pada file HTML:
   ```html
   <script 
     type="text/javascript"
     src="https://app.sandbox.midtrans.com/snap/snap.js"
     data-client-key="SB-Mid-client-YOUR_CLIENT_KEY">
   </script>
   ```

2. **Dapatkan Snap Token dari Backend**:
   Lakukan panggilan `fetch()` ke endpoint backend saat tombol checkout ditekan:
   ```javascript
   const res = await fetch('http://localhost:5001/api/midtrans-token', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + userToken
     },
     body: JSON.stringify({
       order_id: 'ORDER-12345',
       gross_amount: 250000
     })
   });
   const data = await res.json();
   const snapToken = data.data.token;
   ```

3. **Tampilkan Pop-up Pembayaran Midtrans Snap**:
   Panggil fungsi resmi `window.snap.pay()`:
   ```javascript
   window.snap.pay(snapToken, {
     onSuccess: function(result) {
       console.log('Pembayaran Sukses:', result);
       // Alihkan atau tampilkan status sukses
     },
     onPending: function(result) {
       console.log('Menunggu Pembayaran:', result);
       // Tampilkan nomor Virtual Account / petunjuk bayar
     },
     onError: function(result) {
       console.error('Pembayaran Gagal:', result);
       // Tampilkan pesan error
     },
     onClose: function() {
       console.log('Pengguna menutup pop-up sebelum transaksi selesai');
     }
   });
   ```

4. **Pengecekan Status Terverifikasi ke Database**:
   Frontend dapat memeriksa status akhir yang tercatat di database dengan memanggil:
   ```javascript
   const statusRes = await fetch(`http://localhost:5001/api/payments/${orderId}`, {
     headers: { 'Authorization': 'Bearer ' + userToken }
   });
   const paymentInfo = await statusRes.json();
   console.log('Status di Database:', paymentInfo.data.transaction_status);
   ```

---

## ⚡ 4. Notifikasi Webhook Midtrans (HTTP Notification)
Endpoint ini secara langsung dipanggil oleh server Midtrans ke backend Kelompok 3:

- **Endpoint**: `POST /api/midtrans-webhook`
- **Keamanan**: Dilindungi verifikasi signature hash SHA512 standar Midtrans:
  $$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
- **Aksi Sistem**:
  - Jika signature valid, status order di database tabel `payments` akan diperbarui menjadi `success`, `pending`, atau `failed`.
  - Log mentah webhook dicatat pada tabel `payment_logs`.
