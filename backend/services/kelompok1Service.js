/**
 * Service Integrasi Pesanan (Kelompok 1 - Katalog & Keranjang / Order)
 * Kelompok 3 (Anisa & Saffana)
 *
 * Catatan Integrasi:
 * Modul ini dipisahkan secara khusus untuk mengambil detail pesanan (items, customer, gross_amount)
 * dari Kelompok 1. Untuk sekarang menggunakan Mock Data Pesanan, dan dapat diganti
 * dengan pemanggilan HTTP fetch ke endpoint Kelompok 1 saat integrasi dilakukan.
 */

require('dotenv').config();

// Repository Mock Data Pesanan dari Kelompok 1
const MOCK_ORDERS = {
  'ORDER-20261118-KL3-094': {
    order_id: 'ORDER-20261118-KL3-094',
    gross_amount: 250000,
    customer_details: {
      first_name: 'Ahmad',
      last_name: 'Fauzi',
      email: 'ahmad.fauzi@example.com',
      phone: '081234567890'
    },
    item_details: [
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
      },
      {
        id: 'FEE-01',
        name: 'Biaya Layanan & Transaksi',
        price: 5000,
        quantity: 1
      }
    ]
  },
  'ORDER-KL1-SAMPLE': {
    order_id: 'ORDER-KL1-SAMPLE',
    gross_amount: 150000,
    customer_details: {
      first_name: 'Budi',
      last_name: 'Santoso',
      email: 'budi.santoso@example.com',
      phone: '081298765432'
    },
    item_details: [
      {
        id: 'PROD-A',
        name: 'Buku Pemrograman JavaScript',
        price: 150000,
        quantity: 1
      }
    ]
  }
};

/**
 * Mengambil detail pesanan berdasarkan order_id
 * @param {string} orderId 
 * @returns {Promise<Object>}
 */
async function getOrderDetails(orderId) {
  // 1. Cek apakah ada di Mock Data
  if (MOCK_ORDERS[orderId]) {
    return MOCK_ORDERS[orderId];
  }

  // 2. Jika di masa depan Kelompok 1 menyediakan API endpoint:
  /*
  try {
    const response = await fetch(`${process.env.KELOMPOK1_ORDER_API_URL}/${orderId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[Kelompok 1 Service] Gagal fetch ke API Kelompok 1, menggunakan fallback:', err.message);
  }
  */

  // 3. Fallback dinamis jika order_id baru diuji coba
  return {
    order_id: orderId,
    gross_amount: 250000,
    customer_details: {
      first_name: 'Pelanggan',
      last_name: 'Demo',
      email: 'pelanggan@example.com',
      phone: '081234567890'
    },
    item_details: [
      {
        id: 'ITEM-DEFAULT',
        name: `Tagihan Pesanan ${orderId}`,
        price: 250000,
        quantity: 1
      }
    ]
  };
}

module.exports = {
  getOrderDetails,
  MOCK_ORDERS
};
