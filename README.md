# Project Payment Gateway Midtrans (Sandbox)
**Kelompok 3: Anisa dan Saffana**

Proyek ini adalah implementasi sistem **Payment Gateway** menggunakan **Midtrans Snap API (Sandbox)** yang dikerjakan sebagai bagian dari sebuah website e-commerce terintegrasi. Sistem ini dirancang untuk berkolaborasi dengan kelompok lain:
- **Kelompok 1**: Modul Katalog & Keranjang / Order
- **Kelompok 2**: Modul Akun & Autentikasi Pengguna
- **Kelompok 5**: Modul Frontend Website Utama

---

## 👥 Tim Pengembang (Kelompok 3)
1. **Anisa**
2. **Saffana**

---

## 🛠️ Tech Stack
- **Backend**: Node.js & Express.js (REST API, Port 5001)
- **Frontend**: HTML5, CSS3, JavaScript Vanilla (Clean, Modern, & Responsif)
- **Database**: MySQL (Database: `payments`, Tabel: `payments` & `payment_logs`)
- **Payment Gateway**: Midtrans Snap API (Sandbox Environment)
- **Testing**: Node.js Native Test Suite & Postman Collection v2.1.0

---

## 📁 Struktur Direktori
```text
Payment_Gateway/
├── backend/                       # RESTful API Service (Express.js)
│   ├── config/
│   │   ├── database.js            # Koneksi pool MySQL (dengan in-memory fallback)
│   │   └── midtrans.js            # Inisialisasi Midtrans Snap & Core API SDK
│   ├── controllers/
│   │   └── paymentController.js   # Logika Snap Token, Webhook & Cek Status
│   ├── middlewares/
│   │   ├── authMiddleware.js      # Proteksi Bearer Token (Integrasi Kelompok 2)
│   │   └── validator.js           # Validasi ketat request body & parameter
│   ├── routes/
│   │   └── paymentRoutes.js       # Rute endpoint API pembayaran
│   ├── services/
│   │   ├── kelompok1Service.js    # Layanan data pesanan mock (Integrasi Kelompok 1)
│   │   ├── midtransService.js     # Snap token generator & verifikasi SHA512
│   │   └── paymentService.js      # Operasi database tabel payments
│   ├── .env                       # File konfigurasi rahasia lokal
│   ├── .env.example               # Template environment variable
│   ├── package.json               # Dependensi & skrip npm
│   ├── run-all-tests.js           # Runner mandiri pengujian otomatis
│   ├── server.js                  # Entry point Express server
│   └── test-api.js                # Suite 7 pengujian endpoint
│
├── database/
│   ├── schema.sql                 # DDL pembentukan database 'payments' & tabel
│   └── seed.sql                   # Data awal untuk pengujian
│
├── docs/
│   ├── api-documentation.md       # Panduan integrasi Kelompok 1, 2, dan 5
│   └── payment-gateway-kelompok-3.postman_collection.json # File koleksi Postman
│
├── frontend/
│   ├── css/
│   │   └── style.css              # Tampilan modern, bersih, profesional & responsif
│   ├── js/
│   │   ├── app.js                 # Logika pemicu Snap.js, status & sinkronisasi DB
│   │   └── config.js              # Pengaturan Base URL API & Client Key
│   └── index.html                 # Halaman portal pembayaran & status transaksi
│
├── .gitignore                     # Filter node_modules, log, dan kredensial .env
└── README.md                      # Dokumentasi komprehensif proyek
```

---

## 🚀 Panduan Menjalankan Proyek

### 1. Setup Database MySQL
1. Buka MySQL client (phpMyAdmin, DBeaver, HeidiSQL, atau terminal MySQL).
2. Eksekusi skrip pembentukan database di file [database/schema.sql](file:///d:/Payment_Gateway/database/schema.sql):
   ```sql
   SOURCE d:/Payment_Gateway/database/schema.sql;
   ```
   *(Catatan: Jika MySQL belum aktif saat pengujian, backend otomatis beralih ke in-memory cache cadangan sehingga server tetap berjalan normal).*

### 2. Setup dan Jalankan Backend
1. Buka terminal PowerShell dan masuk ke folder `backend`:
   ```powershell
   cd d:\Payment_Gateway\backend
   ```
2. Pastikan dependensi sudah terpasang (jika belum, jalankan `npm install`).
3. Konfigurasi kredensial pada file [.env](file:///d:/Payment_Gateway/backend/.env):
   ```ini
   PORT=5001
   MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_SERVER_KEY
   MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_CLIENT_KEY
   MOCK_BEARER_TOKEN=token-kelompok-2-secret-2026
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=payments
   ```
4. Jalankan backend server:
   ```powershell
   npm start
   ```
   Server akan berjalan di: `http://localhost:5001`.

### 3. Menjalankan Frontend
1. Buka file [frontend/index.html](file:///d:/Payment_Gateway/frontend/index.html) di browser (klik dua kali di file explorer atau klik kanan > *Open with Live Server*).
2. Status koneksi backend akan otomatis terdeteksi (ditandai lampu hijau di kanan atas).
3. Klik tombol **Bayar Sekarang** untuk menguji alur pembuatan Snap Token dan simulasi status.
4. Anda juga dapat menggunakan **Toolbar Simulasi Status** di bawah halaman untuk menguji status Berhasil, Pending, atau Gagal secara instan.
5. Gunakan tombol **Cek Database Terkini** di halaman status untuk memverifikasi bahwa perubahan status telah tersimpan ke database.

---

## 🧪 Pengujian Otomatis (Automated Testing)
Backend telah dilengkapi dengan pengujian end-to-end otomatis untuk memverifikasi seluruh endpoint dan mekanisme keamanan.

Jalankan perintah berikut di terminal:
```powershell
cd d:\Payment_Gateway\backend
node run-all-tests.js
```
Hasil uji mencakup 7 skenario penting:
1. `GET /api/health` - Memastikan server aktif normal.
2. Penolakan request tanpa Bearer token (Proteksi Kelompok 2).
3. Validasi kegagalan request jika field `order_id` kosong.
4. Pembuatan Snap Token transaksi Midtrans (`POST /api/midtrans-token`).
5. Penolakan webhook jika signature key palsu / tidak valid.
6. Pemrosesan webhook berhasil dengan verifikasi signature resmi Midtrans SHA512 (`POST /api/midtrans-webhook`).
7. Pengambilan detail riwayat transaksi dari database `payments` (`GET /api/payments/:order_id`).

---

## 📮 Mengimpor Postman Collection
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di sudut kiri atas.
3. Pilih file:
   [docs/payment-gateway-kelompok-3.postman_collection.json](file:///d:/Payment_Gateway/docs/payment-gateway-kelompok-3.postman_collection.json).
4. Koleksi akan otomatis berisi seluruh endpoint lengkap dengan variabel, contoh request payload, serta contoh response JSON.

---

## 🤝 Panduan Integrasi Kelompok Lain
Detail panduan teknis dan payload JSON untuk masing-masing kelompok tersedia lengkap di:
👉 **[docs/api-documentation.md](file:///d:/Payment_Gateway/docs/api-documentation.md)**
- **Kelompok 1 (Order)**: Format pengiriman payload transaksi dan rincian produk.
- **Kelompok 2 (User)**: Format integrasi header Bearer Token.
- **Kelompok 5 (Frontend)**: Panduan penyematan Snap.js popup dan polling database.
