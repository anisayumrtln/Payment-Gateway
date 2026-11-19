-- Dummy / Seed Data untuk Pengetesan Awal
-- Database: payments, Tabel: payments
-- Kelompok 3 (Anisa & Saffana)

CREATE DATABASE IF NOT EXISTS `payments`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `payments`;

INSERT INTO `payments` 
  (`order_id`, `transaction_id`, `gross_amount`, `payment_type`, `transaction_status`, `customer_name`, `customer_email`, `customer_phone`, `snap_token`)
VALUES
  ('ORDER-20261118-KL3-094', 'TRX-MID-001', 250000.00, 'qris', 'pending', 'Ahmad Fauzi', 'ahmad.fauzi@example.com', '081234567890', 'mock-snap-sample-token-1'),
  ('ORDER-KL1-SAMPLE', 'TRX-MID-002', 150000.00, 'bank_transfer', 'success', 'Budi Santoso', 'budi.santoso@example.com', '081298765432', 'mock-snap-sample-token-2')
ON DUPLICATE KEY UPDATE `gross_amount` = VALUES(`gross_amount`);
