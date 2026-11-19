-- Database Schema: payments
-- Proyek Payment Gateway Midtrans - Kelompok 3 (Anisa & Saffana)

CREATE DATABASE IF NOT EXISTS `payments` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `payments`;

-- Tabel Transaksi Pembayaran
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(100) NOT NULL UNIQUE,
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `gross_amount` DECIMAL(12, 2) NOT NULL,
  `payment_type` VARCHAR(50) DEFAULT NULL,
  `transaction_status` VARCHAR(50) DEFAULT 'pending',
  `fraud_status` VARCHAR(20) DEFAULT NULL,
  `snap_token` VARCHAR(255) DEFAULT NULL,
  `customer_name` VARCHAR(150) DEFAULT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `customer_phone` VARCHAR(30) DEFAULT NULL,
  `signature_key` VARCHAR(255) DEFAULT NULL,
  `payment_time` DATETIME DEFAULT NULL,
  `raw_response` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status` (`transaction_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Riwayat Log Notifikasi Webhook
CREATE TABLE IF NOT EXISTS `payment_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(100) NOT NULL,
  `status_code` VARCHAR(10) DEFAULT NULL,
  `transaction_status` VARCHAR(50) DEFAULT NULL,
  `raw_payload` JSON DEFAULT NULL,
  `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
