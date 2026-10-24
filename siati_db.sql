/*
 Navicat Premium Dump SQL

 Source Server         : SIMRS
 Source Server Type    : MariaDB
 Source Server Version : 110806 (11.8.6-MariaDB-log)
 Source Host           : localhost:3306
 Source Schema         : siati_db

 Target Server Type    : MariaDB
 Target Server Version : 110806 (11.8.6-MariaDB-log)
 File Encoding         : 65001

 Date: 24/10/2026 12:56:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for captcha_challenges
-- ----------------------------
DROP TABLE IF EXISTS `captcha_challenges`;
CREATE TABLE `captcha_challenges`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answerHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `captcha_challenges_token_key`(`token` ASC) USING BTREE,
  INDEX `captcha_challenges_token_idx`(`token` ASC) USING BTREE,
  INDEX `captcha_challenges_expiresAt_idx`(`expiresAt` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of captcha_challenges
-- ----------------------------

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `targetSlaMinutes` int(11) NOT NULL DEFAULT 30,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `categories_name_key`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (5, 'Fasilitas Penunjang TI', 'Telepon internal PABX, sound system poli, CCTV, kelistrikan IT', 45);
INSERT INTO `categories` VALUES (6, 'SIMRS & RME', 'Kendala SIMRS Khanza/web, rekam medis elektronik, bridging BPJS V-Claim', 15);
INSERT INTO `categories` VALUES (7, 'Software Lainnya', 'Aplikasi penunjang RS, sistem antrean, e-prescribing, OS / Office', 25);
INSERT INTO `categories` VALUES (8, 'Hardware & PC', 'PC mati, monitor, printer label resep, scanner barcode, UPS', 30);
INSERT INTO `categories` VALUES (9, 'Jaringan', 'Koneksi LAN, WiFi medis ruangan, access point, internet terputus', 20);

-- ----------------------------
-- Table structure for department_units
-- ----------------------------
DROP TABLE IF EXISTS `department_units`;
CREATE TABLE `department_units`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `buildingZone` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qrIdentifier` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `department_units_qrIdentifier_key`(`qrIdentifier` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of department_units
-- ----------------------------
INSERT INTO `department_units` VALUES (1, 'Instalasi Gawat Darurat (IGD)', 'Gedung Utama Lt. 1', 'LOC-IGD-01');
INSERT INTO `department_units` VALUES (2, 'Kamar Operasi / Bedah Sentral (OK)', 'Gedung Utama Lt. 2', 'LOC-OK-01');
INSERT INTO `department_units` VALUES (3, 'Farmasi Rawat Jalan', 'Gedung Rawat Jalan Lt. 1', 'LOC-FARMASI-RJ');
INSERT INTO `department_units` VALUES (4, 'Farmasi Rawat Inap', 'Gedung Rawat Inap Lt. 1', 'LOC-FARMASI-RI');
INSERT INTO `department_units` VALUES (5, 'Laboratorium Patologi Klinik', 'Gedung Penunjang Lt. 1', 'LOC-LAB-01');
INSERT INTO `department_units` VALUES (6, 'Radiologi & Rontgen', 'Gedung Penunjang Lt. 1', 'LOC-RAD-01');
INSERT INTO `department_units` VALUES (7, 'Poliklinik Penyakit Dalam', 'Gedung Rawat Jalan Lt. 2', 'LOC-POLI-DALAM');
INSERT INTO `department_units` VALUES (8, 'Poliklinik Anak', 'Gedung Rawat Jalan Lt. 2', 'LOC-POLI-ANAK');
INSERT INTO `department_units` VALUES (9, 'Rawat Inap Bangsal Melati', 'Gedung Rawat Inap Lt. 2', 'LOC-BANGSAL-MELATI');
INSERT INTO `department_units` VALUES (10, 'Kasir & Pembayaran Pasien', 'Gedung Utama Lt. 1', 'LOC-KASIR-01');
INSERT INTO `department_units` VALUES (11, 'Instalasi SIMRS & TI', 'Gedung Manajemen Lt. 3', 'LOC-IT-SIMRS');
INSERT INTO `department_units` VALUES (12, 'Direksi & Manajemen RSBM', 'Gedung Manajemen Lt. 3', 'LOC-DIREKSI-01');
INSERT INTO `department_units` VALUES (13, 'Manajemen RSBM', 'Gedung Manajemen Lt. 3', 'LOC-MANAJEMEN-01');

-- ----------------------------
-- Table structure for system_audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `system_audit_logs`;
CREATE TABLE `system_audit_logs`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL CHECK (json_valid(`payload`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `system_audit_logs_createdAt_idx`(`createdAt` ASC) USING BTREE,
  INDEX `system_audit_logs_action_idx`(`action` ASC) USING BTREE,
  INDEX `system_audit_logs_userId_idx`(`userId` ASC) USING BTREE,
  CONSTRAINT `system_audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 106 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_audit_logs
-- ----------------------------
INSERT INTO `system_audit_logs` VALUES (1, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 11:13:19.845');
INSERT INTO `system_audit_logs` VALUES (2, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 11:20:11.524');
INSERT INTO `system_audit_logs` VALUES (3, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-23 11:20:36.382');
INSERT INTO `system_audit_logs` VALUES (4, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"STAFF_USER\"}', '2026-10-23 12:05:42.617');
INSERT INTO `system_audit_logs` VALUES (5, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"STAFF_USER\"}', '2026-10-23 12:47:20.682');
INSERT INTO `system_audit_logs` VALUES (6, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 13:01:23.590');
INSERT INTO `system_audit_logs` VALUES (7, 'f1112edd-8bbd-4848-addd-7d52d81a62a0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"TECHNICIAN\"}', '2026-10-23 13:27:11.907');
INSERT INTO `system_audit_logs` VALUES (8, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"STAFF_USER\"}', '2026-10-23 13:28:28.929');
INSERT INTO `system_audit_logs` VALUES (9, 'f1112edd-8bbd-4848-addd-7d52d81a62a0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"TECHNICIAN\"}', '2026-10-23 13:32:01.163');
INSERT INTO `system_audit_logs` VALUES (10, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 13:32:41.652');
INSERT INTO `system_audit_logs` VALUES (11, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"HELPDESK\"}', '2026-10-23 13:38:52.423');
INSERT INTO `system_audit_logs` VALUES (12, 'f1112edd-8bbd-4848-addd-7d52d81a62a0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"IT_STAFF\"}', '2026-10-23 13:57:17.066');
INSERT INTO `system_audit_logs` VALUES (13, 'f1112edd-8bbd-4848-addd-7d52d81a62a0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"IT_STAFF\"}', '2026-10-23 14:22:45.085');
INSERT INTO `system_audit_logs` VALUES (14, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'FAILED_LOGIN_WRONG_PASSWORD', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"attemptCount\":1}', '2026-10-23 14:23:17.874');
INSERT INTO `system_audit_logs` VALUES (15, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'FAILED_LOGIN_WRONG_PASSWORD', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"attemptCount\":2}', '2026-10-23 14:23:24.966');
INSERT INTO `system_audit_logs` VALUES (16, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'FAILED_LOGIN_WRONG_PASSWORD', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"attemptCount\":3}', '2026-10-23 14:23:42.836');
INSERT INTO `system_audit_logs` VALUES (17, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 14:27:51.423');
INSERT INTO `system_audit_logs` VALUES (18, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 14:48:48.920');
INSERT INTO `system_audit_logs` VALUES (19, '106b5b33-676d-4d16-9ba7-46e851cd58d0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"MANAGEMENT\"}', '2026-10-23 15:02:44.751');
INSERT INTO `system_audit_logs` VALUES (20, '106b5b33-676d-4d16-9ba7-46e851cd58d0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"MANAGEMENT\"}', '2026-10-23 15:05:21.265');
INSERT INTO `system_audit_logs` VALUES (21, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 15:36:12.727');
INSERT INTO `system_audit_logs` VALUES (22, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0007\",\"previousStatus\":\"PENDING_PARTS\",\"newStatus\":\"ASSIGNED\"}', '2026-10-23 15:36:44.464');
INSERT INTO `system_audit_logs` VALUES (23, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'LenovoVantage/3.0.0.208', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 15:45:11.579');
INSERT INTO `system_audit_logs` VALUES (24, '106b5b33-676d-4d16-9ba7-46e851cd58d0', 'LOGIN_SUCCESS', '::1', 'LenovoVantage/3.0.0.208', '{\"role\":\"MANAGEMENT\"}', '2026-10-23 15:46:28.053');
INSERT INTO `system_audit_logs` VALUES (25, '106b5b33-676d-4d16-9ba7-46e851cd58d0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"MANAGEMENT\"}', '2026-10-23 15:46:35.794');
INSERT INTO `system_audit_logs` VALUES (26, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-23 15:50:20.258');
INSERT INTO `system_audit_logs` VALUES (27, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 01:07:09.810');
INSERT INTO `system_audit_logs` VALUES (28, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-24 01:39:51.043');
INSERT INTO `system_audit_logs` VALUES (29, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 01:40:21.254');
INSERT INTO `system_audit_logs` VALUES (30, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 01:56:21.707');
INSERT INTO `system_audit_logs` VALUES (31, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-24 02:00:48.755');
INSERT INTO `system_audit_logs` VALUES (32, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 02:01:16.773');
INSERT INTO `system_audit_logs` VALUES (33, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-24 02:02:42.381');
INSERT INTO `system_audit_logs` VALUES (34, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 02:07:51.823');
INSERT INTO `system_audit_logs` VALUES (35, NULL, 'FAILED_LOGIN_USER_NOT_FOUND', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"username\":\"manajemen\"}', '2026-10-24 02:24:23.147');
INSERT INTO `system_audit_logs` VALUES (36, NULL, 'FAILED_LOGIN_USER_NOT_FOUND', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"username\":\"manajemen\"}', '2026-10-24 02:24:28.260');
INSERT INTO `system_audit_logs` VALUES (37, '106b5b33-676d-4d16-9ba7-46e851cd58d0', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"MANAGEMENT\"}', '2026-10-24 02:24:39.134');
INSERT INTO `system_audit_logs` VALUES (38, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-24 02:54:35.012');
INSERT INTO `system_audit_logs` VALUES (39, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 02:55:02.939');
INSERT INTO `system_audit_logs` VALUES (40, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:20.634');
INSERT INTO `system_audit_logs` VALUES (41, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:22.095');
INSERT INTO `system_audit_logs` VALUES (42, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:25.384');
INSERT INTO `system_audit_logs` VALUES (43, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:27.633');
INSERT INTO `system_audit_logs` VALUES (44, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:29.399');
INSERT INTO `system_audit_logs` VALUES (45, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:30.521');
INSERT INTO `system_audit_logs` VALUES (46, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:31.356');
INSERT INTO `system_audit_logs` VALUES (47, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:32.169');
INSERT INTO `system_audit_logs` VALUES (48, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:32.904');
INSERT INTO `system_audit_logs` VALUES (49, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:33.626');
INSERT INTO `system_audit_logs` VALUES (50, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":false}', '2026-10-24 02:55:34.906');
INSERT INTO `system_audit_logs` VALUES (51, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"106b5b33-676d-4d16-9ba7-46e851cd58d0\",\"targetUsername\":\"direksi\",\"newStatus\":true}', '2026-10-24 02:55:36.049');
INSERT INTO `system_audit_logs` VALUES (52, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_DEACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"ce3f8e68-4bee-41c4-9201-01d7ae6d8236\",\"targetUsername\":\"siti\",\"newStatus\":false}', '2026-10-24 03:12:33.894');
INSERT INTO `system_audit_logs` VALUES (53, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'SUPERADMIN_ACTIVATE_USER', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"targetUserId\":\"ce3f8e68-4bee-41c4-9201-01d7ae6d8236\",\"targetUsername\":\"siti\",\"newStatus\":true}', '2026-10-24 03:12:35.821');
INSERT INTO `system_audit_logs` VALUES (54, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-24 04:14:38.584');
INSERT INTO `system_audit_logs` VALUES (55, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"IT_STAFF\"}', '2026-10-24 04:14:58.821');
INSERT INTO `system_audit_logs` VALUES (56, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'CREATE_TICKET', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:16:17.853');
INSERT INTO `system_audit_logs` VALUES (57, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_LOW', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"LOW\"}', '2026-10-24 04:16:54.141');
INSERT INTO `system_audit_logs` VALUES (58, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_MEDIUM', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0007\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"ASSIGNED\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:16:59.152');
INSERT INTO `system_audit_logs` VALUES (59, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0007\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:17:04.724');
INSERT INTO `system_audit_logs` VALUES (60, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0007\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:17:31.548');
INSERT INTO `system_audit_logs` VALUES (61, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_MEDIUM', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:17:48.797');
INSERT INTO `system_audit_logs` VALUES (62, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:17:55.578');
INSERT INTO `system_audit_logs` VALUES (63, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:18:19.535');
INSERT INTO `system_audit_logs` VALUES (64, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:18:22.039');
INSERT INTO `system_audit_logs` VALUES (65, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0001\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:18:35.982');
INSERT INTO `system_audit_logs` VALUES (66, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'CREATE_TICKET', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:20:21.493');
INSERT INTO `system_audit_logs` VALUES (67, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:20:41.743');
INSERT INTO `system_audit_logs` VALUES (68, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:20:51.829');
INSERT INTO `system_audit_logs` VALUES (69, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:21:49.323');
INSERT INTO `system_audit_logs` VALUES (70, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_PENDING_PARTS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"PENDING_PARTS\"}', '2026-10-24 04:21:51.519');
INSERT INTO `system_audit_logs` VALUES (71, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"PENDING_PARTS\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:22:31.895');
INSERT INTO `system_audit_logs` VALUES (72, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0002\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:22:40.786');
INSERT INTO `system_audit_logs` VALUES (73, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'CREATE_TICKET', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0003\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:23:25.368');
INSERT INTO `system_audit_logs` VALUES (74, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0003\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:23:55.024');
INSERT INTO `system_audit_logs` VALUES (75, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0003\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:24:09.015');
INSERT INTO `system_audit_logs` VALUES (76, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0003\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:24:11.711');
INSERT INTO `system_audit_logs` VALUES (77, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_HIGH', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"HIGH\"}', '2026-10-24 04:43:33.509');
INSERT INTO `system_audit_logs` VALUES (78, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'CREATE_TICKET', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:49:38.527');
INSERT INTO `system_audit_logs` VALUES (79, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_HIGH', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"HIGH\"}', '2026-10-24 04:50:01.405');
INSERT INTO `system_audit_logs` VALUES (80, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_LOW', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"LOW\"}', '2026-10-24 04:50:03.591');
INSERT INTO `system_audit_logs` VALUES (81, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_MEDIUM', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:50:05.555');
INSERT INTO `system_audit_logs` VALUES (82, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:50:11.438');
INSERT INTO `system_audit_logs` VALUES (83, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:50:16.172');
INSERT INTO `system_audit_logs` VALUES (84, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_PENDING_PARTS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"PENDING_PARTS\"}', '2026-10-24 04:50:21.901');
INSERT INTO `system_audit_logs` VALUES (85, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"PENDING_PARTS\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:50:28.133');
INSERT INTO `system_audit_logs` VALUES (86, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:50:38.625');
INSERT INTO `system_audit_logs` VALUES (87, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_EMERGENCY', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"EMERGENCY\"}', '2026-10-24 04:50:51.524');
INSERT INTO `system_audit_logs` VALUES (88, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_LOW', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"LOW\"}', '2026-10-24 04:50:53.146');
INSERT INTO `system_audit_logs` VALUES (89, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:50:54.428');
INSERT INTO `system_audit_logs` VALUES (90, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_EMERGENCY', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"ASSIGNED\",\"urgency\":\"EMERGENCY\"}', '2026-10-24 04:50:57.337');
INSERT INTO `system_audit_logs` VALUES (91, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:51:00.021');
INSERT INTO `system_audit_logs` VALUES (92, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0009\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:51:03.259');
INSERT INTO `system_audit_logs` VALUES (93, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'CREATE_TICKET', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"urgency\":\"MEDIUM\"}', '2026-10-24 04:51:16.116');
INSERT INTO `system_audit_logs` VALUES (94, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_HIGH', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"HIGH\"}', '2026-10-24 04:51:25.965');
INSERT INTO `system_audit_logs` VALUES (95, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_EMERGENCY', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"EMERGENCY\"}', '2026-10-24 04:51:28.466');
INSERT INTO `system_audit_logs` VALUES (96, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_SET_URGENCY_HIGH', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"SUBMITTED\",\"urgency\":\"HIGH\"}', '2026-10-24 04:51:30.768');
INSERT INTO `system_audit_logs` VALUES (97, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_ASSIGNED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"SUBMITTED\",\"newStatus\":\"ASSIGNED\"}', '2026-10-24 04:51:36.648');
INSERT INTO `system_audit_logs` VALUES (98, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_IN_PROGRESS', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"ASSIGNED\",\"newStatus\":\"IN_PROGRESS\"}', '2026-10-24 04:51:58.229');
INSERT INTO `system_audit_logs` VALUES (99, '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'TICKET_STATUS_RESOLVED', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"IN_PROGRESS\",\"newStatus\":\"RESOLVED\"}', '2026-10-24 04:52:00.667');
INSERT INTO `system_audit_logs` VALUES (100, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 04:53:17.600');
INSERT INTO `system_audit_logs` VALUES (101, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 04:54:32.568');
INSERT INTO `system_audit_logs` VALUES (102, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'TICKET_SET_URGENCY_LOW', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0005\",\"previousStatus\":\"RESOLVED\",\"newStatus\":\"RESOLVED\",\"urgency\":\"LOW\"}', '2026-10-24 04:54:57.155');
INSERT INTO `system_audit_logs` VALUES (103, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'TICKET_SET_URGENCY_LOW', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261024-0004\",\"previousStatus\":\"RESOLVED\",\"newStatus\":\"RESOLVED\",\"urgency\":\"LOW\"}', '2026-10-24 04:55:02.838');
INSERT INTO `system_audit_logs` VALUES (104, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'TICKET_SET_URGENCY_EMERGENCY', '127.0.0.1', 'Browser', '{\"ticketNumber\":\"TKT-20261023-0008\",\"previousStatus\":\"RESOLVED\",\"newStatus\":\"RESOLVED\",\"urgency\":\"EMERGENCY\"}', '2026-10-24 04:55:17.306');
INSERT INTO `system_audit_logs` VALUES (105, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'LenovoVantage/3.0.0.208', '{\"role\":\"SUPERADMIN\"}', '2026-10-24 05:08:35.358');

-- ----------------------------
-- Table structure for ticket_attachments
-- ----------------------------
DROP TABLE IF EXISTS `ticket_attachments`;
CREATE TABLE `ticket_attachments`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileType` enum('IMAGE','VIDEO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storedFilename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSizeBytes` int(11) NOT NULL,
  `mimeType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sha256Hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `durationSeconds` int(11) NULL DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ticket_attachments_storedFilename_key`(`storedFilename` ASC) USING BTREE,
  INDEX `ticket_attachments_ticketId_idx`(`ticketId` ASC) USING BTREE,
  CONSTRAINT `ticket_attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ticket_attachments
-- ----------------------------
INSERT INTO `ticket_attachments` VALUES ('2298ff02-84ba-4055-b0cc-b7caa5871ff2', '7b192861-e566-4d8c-9751-3cbf8664f6b8', 'IMAGE', 'HAK AKSES.PNG', '914076c2-4195-4f54-a539-015776b3aa76.png', 'uploads/914076c2-4195-4f54-a539-015776b3aa76.png', 246898, 'image/png', '5215f43534b45179d7e225dc0929edc4a54d4e62f51eba12d58113062bf54f39', NULL, '2026-10-24 04:16:17.848');
INSERT INTO `ticket_attachments` VALUES ('45a7dbae-749b-4825-a3a2-7f34f025c3c8', '2dd82474-7555-4ff5-b559-4d6187a953be', 'IMAGE', 'fahri.jpg', '52510232-6f09-4e5b-a185-e3ae91615f15.jpg', 'uploads/52510232-6f09-4e5b-a185-e3ae91615f15.jpg', 2160783, 'image/jpeg', 'fd88af12e9ecc080b6f62e3cd969608b3d51ae64e1f0aa7a527c024cb7f9c1ff', NULL, '2026-10-24 04:49:38.522');
INSERT INTO `ticket_attachments` VALUES ('ae0f23ec-2fa6-4a00-b7ca-885ab5f12dc0', '0b7cb3f1-785b-43d8-b111-1005340d2949', 'IMAGE', 'WhatsApp Image 2026-09-17 at 12.33.22.jpeg', 'c43f3d39-4d4d-4eae-ba0f-ec265f08df06.jpg', 'uploads/c43f3d39-4d4d-4eae-ba0f-ec265f08df06.jpg', 278464, 'image/jpeg', '6ec33ccbbe25754d4f3c3c34faf21e66369784c20b56b2013f09955bafd10ad9', NULL, '2026-10-24 04:20:21.489');
INSERT INTO `ticket_attachments` VALUES ('b3335be9-e8ea-4880-90f7-d8b2959be6ff', '2dd82474-7555-4ff5-b559-4d6187a953be', 'VIDEO', 'cuci tangna paling baru.mp4', '3fe03236-6179-4fdb-b532-7fa5ef478923.mp4', 'uploads/3fe03236-6179-4fdb-b532-7fa5ef478923.mp4', 5020555, 'video/mp4', 'ac95a7647ee7266f53bea422f0434415801969d1cafb905b40621e80a27f3c4f', NULL, '2026-10-24 04:49:38.522');
INSERT INTO `ticket_attachments` VALUES ('de992a25-9767-43b9-8e7d-2d282caf363c', 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', 'VIDEO', 'cuci tangan.mp4', '25d87266-52ef-4d01-a08b-68529ca46573.mp4', 'uploads/25d87266-52ef-4d01-a08b-68529ca46573.mp4', 3058592, 'video/mp4', '23667ca0b69a652a4267bf4e7727c7614a22702f85d4fbd399331a58a265fc0d', NULL, '2026-10-24 04:23:25.365');

-- ----------------------------
-- Table structure for ticket_ratings
-- ----------------------------
DROP TABLE IF EXISTS `ticket_ratings`;
CREATE TABLE `ticket_ratings`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ratingScore` tinyint(4) NOT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ticket_ratings_ticketId_key`(`ticketId` ASC) USING BTREE,
  CONSTRAINT `ticket_ratings_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ticket_ratings
-- ----------------------------
INSERT INTO `ticket_ratings` VALUES ('21f17727-7ada-4e0b-8663-312ae5100c8b', '7b192861-e566-4d8c-9751-3cbf8664f6b8', 4, '', '2026-10-24 04:18:43.345');
INSERT INTO `ticket_ratings` VALUES ('23772cd8-6062-4ffd-aed6-d0f5cd9884ac', '143be0d7-6d1e-46cc-aa7d-7eb7cc538d7d', 5, 'Update sertifikat cepat selesai tanpa mengganggu pembacaan rontgen.', '2026-10-23 14:57:19.081');
INSERT INTO `ticket_ratings` VALUES ('72d12900-4c59-47e5-9821-6b966749d6f5', '0b7cb3f1-785b-43d8-b111-1005340d2949', 5, '', '2026-10-24 04:22:59.475');
INSERT INTO `ticket_ratings` VALUES ('7a5908ba-1ebd-4e52-9853-1b9e28073d6c', '5bde543a-0b35-4e7f-99e1-1bf356dccf03', 5, 'Sinyal WiFi sudah stabil di sepanjang lorong bangsal.', '2026-10-23 14:57:19.082');
INSERT INTO `ticket_ratings` VALUES ('9ad29678-c7c3-44a2-aa6d-5d37867ccc36', '2042bf3e-663e-4ff3-8fac-7c9b55b2879c', 4, 'Printer normal kembali setelah roller dibersihkan dan kalibrasi ulang.', '2026-10-23 14:57:19.078');
INSERT INTO `ticket_ratings` VALUES ('9cb13741-2fc6-4546-8876-4ad8fc172f63', '2dd82474-7555-4ff5-b559-4d6187a953be', 5, '', '2026-10-24 04:50:42.551');
INSERT INTO `ticket_ratings` VALUES ('b7f4c130-5152-4bb2-ac4d-30ad581e1226', 'e2ed07b9-5079-4c2f-9983-e28a02ba0a97', 5, 'Teknisi langsung tiba dalam hitungan menit di OK. Mantap!', '2026-10-23 14:57:19.077');
INSERT INTO `ticket_ratings` VALUES ('c0908035-4399-48f5-a2b7-4f8430a88144', 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', 5, '', '2026-10-24 04:24:14.284');
INSERT INTO `ticket_ratings` VALUES ('c3e6e175-0744-4b63-a4e1-4c005c844d91', '786150d0-e242-4e13-9337-3f8a62c41122', 5, 'Template laporan kasir langsung diperbaiki, antrean pasien lancar.', '2026-10-23 14:57:19.085');
INSERT INTO `ticket_ratings` VALUES ('ffc6aa1b-9317-4457-a0d6-ec039972fdc5', '6c8e0e6c-4b81-42c1-a2e3-bee2bbf3f030', 5, 'Sangat responsif dan sigap! Pelayanan darurat IGD langsung normal kembali.', '2026-10-23 14:57:19.075');

-- ----------------------------
-- Table structure for ticket_timeline_logs
-- ----------------------------
DROP TABLE IF EXISTS `ticket_timeline_logs`;
CREATE TABLE `ticket_timeline_logs`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ticketId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorUserId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `previousStatus` enum('SUBMITTED','ASSIGNED','IN_PROGRESS','PENDING_PARTS','RESOLVED','CLOSED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `newStatus` enum('SUBMITTED','ASSIGNED','IN_PROGRESS','PENDING_PARTS','RESOLVED','CLOSED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ticket_timeline_logs_ticketId_idx`(`ticketId` ASC) USING BTREE,
  CONSTRAINT `ticket_timeline_logs_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 49 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ticket_timeline_logs
-- ----------------------------
INSERT INTO `ticket_timeline_logs` VALUES (1, '9a658513-d0f4-4002-8e57-6722cbc0ecce', 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'Super Admin SIMRS', 'PENDING_PARTS', 'ASSIGNED', 'Penugasan dari meja kendali TI.', '2026-10-23 15:36:44.461');
INSERT INTO `ticket_timeline_logs` VALUES (2, '7b192861-e566-4d8c-9751-3cbf8664f6b8', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'Ns. Siti Rahma (Perawat IGD)', NULL, 'SUBMITTED', 'Tiket berhasil diterbitkan oleh pelapor.', '2026-10-24 04:16:17.848');
INSERT INTO `ticket_timeline_logs` VALUES (3, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi LOW oleh Operator Staf TI RSBM', '2026-10-24 04:16:54.137');
INSERT INTO `ticket_timeline_logs` VALUES (4, '9a658513-d0f4-4002-8e57-6722cbc0ecce', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'ASSIGNED', 'Urgensi tiket disesuaikan menjadi MEDIUM oleh Operator Staf TI RSBM', '2026-10-24 04:16:59.149');
INSERT INTO `ticket_timeline_logs` VALUES (5, '9a658513-d0f4-4002-8e57-6722cbc0ecce', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:17:04.720');
INSERT INTO `ticket_timeline_logs` VALUES (6, '9a658513-d0f4-4002-8e57-6722cbc0ecce', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', 's', '2026-10-24 04:17:31.545');
INSERT INTO `ticket_timeline_logs` VALUES (7, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi MEDIUM oleh Operator Staf TI RSBM', '2026-10-24 04:17:48.794');
INSERT INTO `ticket_timeline_logs` VALUES (8, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Penugasan dari meja kendali TI.', '2026-10-24 04:17:55.575');
INSERT INTO `ticket_timeline_logs` VALUES (9, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'ASSIGNED', 'Penugasan dari meja kendali TI.', '2026-10-24 04:18:19.532');
INSERT INTO `ticket_timeline_logs` VALUES (10, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:18:22.037');
INSERT INTO `ticket_timeline_logs` VALUES (11, '7b192861-e566-4d8c-9751-3cbf8664f6b8', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', 'sudah selesai', '2026-10-24 04:18:35.979');
INSERT INTO `ticket_timeline_logs` VALUES (12, '0b7cb3f1-785b-43d8-b111-1005340d2949', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'Ns. Siti Rahma (Perawat IGD)', NULL, 'SUBMITTED', 'Tiket berhasil diterbitkan oleh pelapor.', '2026-10-24 04:20:21.489');
INSERT INTO `ticket_timeline_logs` VALUES (13, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Penugasan dari meja kendali TI.', '2026-10-24 04:20:41.739');
INSERT INTO `ticket_timeline_logs` VALUES (14, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'ASSIGNED', 'Penugasan dari meja kendali TI.', '2026-10-24 04:20:51.827');
INSERT INTO `ticket_timeline_logs` VALUES (15, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:21:49.320');
INSERT INTO `ticket_timeline_logs` VALUES (16, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'PENDING_PARTS', 'Menunggu ketersediaan sparepart.', '2026-10-24 04:21:51.517');
INSERT INTO `ticket_timeline_logs` VALUES (17, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'PENDING_PARTS', 'IN_PROGRESS', 'Part tersedia, lanjut pengerjaan.', '2026-10-24 04:22:31.894');
INSERT INTO `ticket_timeline_logs` VALUES (18, '0b7cb3f1-785b-43d8-b111-1005340d2949', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', 'sudah ditangani', '2026-10-24 04:22:40.784');
INSERT INTO `ticket_timeline_logs` VALUES (19, 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'Ns. Siti Rahma (Perawat IGD)', NULL, 'SUBMITTED', 'Tiket berhasil diterbitkan oleh pelapor.', '2026-10-24 04:23:25.365');
INSERT INTO `ticket_timeline_logs` VALUES (20, 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Tiket diambil langsung oleh Operator Staf TI RSBM untuk penanganan segera.', '2026-10-24 04:23:55.021');
INSERT INTO `ticket_timeline_logs` VALUES (21, 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:24:09.012');
INSERT INTO `ticket_timeline_logs` VALUES (22, 'b55fa85d-3000-422d-8395-ac02bc3fdd3c', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', 'asd', '2026-10-24 04:24:11.709');
INSERT INTO `ticket_timeline_logs` VALUES (23, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi HIGH oleh Operator Staf TI RSBM', '2026-10-24 04:43:33.505');
INSERT INTO `ticket_timeline_logs` VALUES (24, '2dd82474-7555-4ff5-b559-4d6187a953be', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'Ns. Siti Rahma (Perawat IGD)', NULL, 'SUBMITTED', 'Tiket berhasil diterbitkan oleh pelapor.', '2026-10-24 04:49:38.522');
INSERT INTO `ticket_timeline_logs` VALUES (25, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi HIGH oleh Operator Staf TI RSBM', '2026-10-24 04:50:01.402');
INSERT INTO `ticket_timeline_logs` VALUES (26, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi LOW oleh Operator Staf TI RSBM', '2026-10-24 04:50:03.588');
INSERT INTO `ticket_timeline_logs` VALUES (27, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi MEDIUM oleh Operator Staf TI RSBM', '2026-10-24 04:50:05.552');
INSERT INTO `ticket_timeline_logs` VALUES (28, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Tiket diambil langsung oleh Operator Staf TI RSBM untuk penanganan segera.', '2026-10-24 04:50:11.435');
INSERT INTO `ticket_timeline_logs` VALUES (29, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:50:16.168');
INSERT INTO `ticket_timeline_logs` VALUES (30, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'PENDING_PARTS', 'Menunggu ketersediaan sparepart.', '2026-10-24 04:50:21.898');
INSERT INTO `ticket_timeline_logs` VALUES (31, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'PENDING_PARTS', 'IN_PROGRESS', 'Part tersedia, lanjut pengerjaan.', '2026-10-24 04:50:28.129');
INSERT INTO `ticket_timeline_logs` VALUES (32, '2dd82474-7555-4ff5-b559-4d6187a953be', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', '88', '2026-10-24 04:50:38.622');
INSERT INTO `ticket_timeline_logs` VALUES (33, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi EMERGENCY oleh Operator Staf TI RSBM', '2026-10-24 04:50:51.520');
INSERT INTO `ticket_timeline_logs` VALUES (34, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi LOW oleh Operator Staf TI RSBM', '2026-10-24 04:50:53.144');
INSERT INTO `ticket_timeline_logs` VALUES (35, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Tiket diambil langsung oleh Operator Staf TI RSBM untuk penanganan segera.', '2026-10-24 04:50:54.426');
INSERT INTO `ticket_timeline_logs` VALUES (36, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'ASSIGNED', 'Urgensi tiket disesuaikan menjadi EMERGENCY oleh Operator Staf TI RSBM', '2026-10-24 04:50:57.334');
INSERT INTO `ticket_timeline_logs` VALUES (37, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:51:00.019');
INSERT INTO `ticket_timeline_logs` VALUES (38, 'dfee677b-7be1-41ff-b62e-4387ae751b75', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', '5', '2026-10-24 04:51:03.255');
INSERT INTO `ticket_timeline_logs` VALUES (39, '5820936f-5594-4b10-92e9-ab0d5c9ee306', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'Ns. Siti Rahma (Perawat IGD)', NULL, 'SUBMITTED', 'Tiket berhasil diterbitkan oleh pelapor.', '2026-10-24 04:51:16.113');
INSERT INTO `ticket_timeline_logs` VALUES (40, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi HIGH oleh Operator Staf TI RSBM', '2026-10-24 04:51:25.962');
INSERT INTO `ticket_timeline_logs` VALUES (41, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi EMERGENCY oleh Operator Staf TI RSBM', '2026-10-24 04:51:28.463');
INSERT INTO `ticket_timeline_logs` VALUES (42, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'SUBMITTED', 'Urgensi tiket disesuaikan menjadi HIGH oleh Operator Staf TI RSBM', '2026-10-24 04:51:30.765');
INSERT INTO `ticket_timeline_logs` VALUES (43, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'SUBMITTED', 'ASSIGNED', 'Tiket diambil langsung oleh Operator Staf TI RSBM untuk penanganan segera.', '2026-10-24 04:51:36.645');
INSERT INTO `ticket_timeline_logs` VALUES (44, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'ASSIGNED', 'IN_PROGRESS', 'Mulai perbaikan fisik di lokasi.', '2026-10-24 04:51:58.227');
INSERT INTO `ticket_timeline_logs` VALUES (45, '5820936f-5594-4b10-92e9-ab0d5c9ee306', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'Operator Staf TI RSBM', 'IN_PROGRESS', 'RESOLVED', 'asd', '2026-10-24 04:52:00.665');
INSERT INTO `ticket_timeline_logs` VALUES (46, '5820936f-5594-4b10-92e9-ab0d5c9ee306', 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'Super Admin SIMRS', 'RESOLVED', 'RESOLVED', 'Urgensi tiket disesuaikan menjadi LOW oleh Super Admin SIMRS', '2026-10-24 04:54:57.152');
INSERT INTO `ticket_timeline_logs` VALUES (47, '2dd82474-7555-4ff5-b559-4d6187a953be', 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'Super Admin SIMRS', 'RESOLVED', 'RESOLVED', 'Urgensi tiket disesuaikan menjadi LOW oleh Super Admin SIMRS', '2026-10-24 04:55:02.834');
INSERT INTO `ticket_timeline_logs` VALUES (48, '786150d0-e242-4e13-9337-3f8a62c41122', 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'Super Admin SIMRS', 'RESOLVED', 'RESOLVED', 'Urgensi tiket disesuaikan menjadi EMERGENCY oleh Super Admin SIMRS', '2026-10-24 04:55:17.302');

-- ----------------------------
-- Table structure for tickets
-- ----------------------------
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporterId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unitId` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `urgency` enum('EMERGENCY','HIGH','MEDIUM','LOW') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `status` enum('SUBMITTED','ASSIGNED','IN_PROGRESS','PENDING_PARTS','RESOLVED','CLOSED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUBMITTED',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignedTechnicianId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `submittedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `firstAssignedAt` datetime(3) NULL DEFAULT NULL,
  `workStartedAt` datetime(3) NULL DEFAULT NULL,
  `workResolvedAt` datetime(3) NULL DEFAULT NULL,
  `closedAt` datetime(3) NULL DEFAULT NULL,
  `totalPendingMinutes` int(11) NOT NULL DEFAULT 0,
  `responseMinutes` int(11) NULL DEFAULT NULL,
  `repairMinutes` int(11) NULL DEFAULT NULL,
  `totalLeadMinutes` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `tickets_ticketNumber_key`(`ticketNumber` ASC) USING BTREE,
  INDEX `tickets_status_idx`(`status` ASC) USING BTREE,
  INDEX `tickets_urgency_idx`(`urgency` ASC) USING BTREE,
  INDEX `tickets_submittedAt_idx`(`submittedAt` ASC) USING BTREE,
  INDEX `tickets_reporterId_idx`(`reporterId` ASC) USING BTREE,
  INDEX `tickets_assignedTechnicianId_idx`(`assignedTechnicianId` ASC) USING BTREE,
  INDEX `tickets_unitId_idx`(`unitId` ASC) USING BTREE,
  INDEX `tickets_categoryId_idx`(`categoryId` ASC) USING BTREE,
  CONSTRAINT `tickets_assignedTechnicianId_fkey` FOREIGN KEY (`assignedTechnicianId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tickets_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `tickets_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `tickets_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `department_units` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tickets
-- ----------------------------
INSERT INTO `tickets` VALUES ('0b7cb3f1-785b-43d8-b111-1005340d2949', 'TKT-20261024-0002', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 9, 'MEDIUM', 'RESOLVED', 'wifi mati di sini', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-24 04:20:21.489', '2026-10-24 04:20:51.826', '2026-10-24 04:21:49.319', '2026-10-24 04:22:40.782', NULL, 0, 1, 1, 2);
INSERT INTO `tickets` VALUES ('143be0d7-6d1e-46cc-aa7d-7eb7cc538d7d', 'TKT-20261023-0005', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 6, 7, 'MEDIUM', 'RESOLVED', 'Viewer DICOM PACS radiologi meminta update sertifikat SSL internal server RSBM.', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-23 14:57:19.080', NULL, NULL, NULL, NULL, 0, 9, 15, 24);
INSERT INTO `tickets` VALUES ('2042bf3e-663e-4ff3-8fac-7c9b55b2879c', 'TKT-20261023-0003', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 3, 8, 'HIGH', 'RESOLVED', 'Printer barcode etiket obat macet roll kertasnya. Antrean pasien rawat jalan mulai menumpuk.', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-23 14:57:19.077', NULL, NULL, NULL, NULL, 0, 6, 18, 24);
INSERT INTO `tickets` VALUES ('281f1f85-58c2-4400-9597-c4244cf353cd', 'TKT-20261023-0004', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 5, 6, 'HIGH', 'IN_PROGRESS', 'Interfacing alat hematology analyzer gagal sinkronisasi otomatis ke modul Laboratorium SIMRS.', 'f1112edd-8bbd-4848-addd-7d52d81a62a0', '2026-10-23 14:57:19.079', NULL, NULL, NULL, NULL, 0, 5, NULL, NULL);
INSERT INTO `tickets` VALUES ('2dd82474-7555-4ff5-b559-4d6187a953be', 'TKT-20261024-0004', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 7, 'LOW', 'RESOLVED', 'Gagal bridging BPJS V-Claim', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-24 04:49:38.522', '2026-10-24 04:50:11.434', '2026-10-24 04:50:16.167', '2026-10-24 04:50:38.620', NULL, 0, 1, 1, 1);
INSERT INTO `tickets` VALUES ('5820936f-5594-4b10-92e9-ab0d5c9ee306', 'TKT-20261024-0005', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 6, 'LOW', 'RESOLVED', 'SIMRS hang saat simpan rekam medis', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-24 04:51:16.113', '2026-10-24 04:51:36.644', '2026-10-24 04:51:58.226', '2026-10-24 04:52:00.664', NULL, 0, 1, 1, 1);
INSERT INTO `tickets` VALUES ('5bde543a-0b35-4e7f-99e1-1bf356dccf03', 'TKT-20261023-0006', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 9, 9, 'MEDIUM', 'RESOLVED', 'Access Point WiFi bangsal rawat inap Melati putus sambungan ke tablet visit dokter spesialis.', 'f1112edd-8bbd-4848-addd-7d52d81a62a0', '2026-10-23 14:57:19.081', NULL, NULL, NULL, NULL, 0, 8, 14, 22);
INSERT INTO `tickets` VALUES ('6c8e0e6c-4b81-42c1-a2e3-bee2bbf3f030', 'TKT-20261023-0001', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 6, 'EMERGENCY', 'RESOLVED', 'PC Tindakan IGD error bridging BPJS V-Claim. Resep pasien darurat tidak bisa terkirim ke Farmasi.', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-23 14:57:19.074', NULL, NULL, NULL, NULL, 0, 3, 11, 14);
INSERT INTO `tickets` VALUES ('786150d0-e242-4e13-9337-3f8a62c41122', 'TKT-20261023-0008', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 10, 6, 'EMERGENCY', 'RESOLVED', 'Kwitansi pelunasan pasien rawat inap tidak muncul barcode verifikasi kasir.', 'f1112edd-8bbd-4848-addd-7d52d81a62a0', '2026-10-23 14:57:19.084', NULL, NULL, NULL, NULL, 0, 5, 9, 14);
INSERT INTO `tickets` VALUES ('7b192861-e566-4d8c-9751-3cbf8664f6b8', 'TKT-20261024-0001', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 3, 6, 'MEDIUM', 'RESOLVED', 'saat input data di pengkajian awal keperawatan. muncul error ada kesalahan query', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-24 04:16:17.848', '2026-10-24 04:18:19.530', '2026-10-24 04:18:22.035', '2026-10-24 04:18:35.977', NULL, 0, 2, 1, 2);
INSERT INTO `tickets` VALUES ('9a658513-d0f4-4002-8e57-6722cbc0ecce', 'TKT-20261023-0007', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 7, 5, 'MEDIUM', 'RESOLVED', 'Mikrofon pemanggil antrean poliklinik suara berdegung keras. Menunggu kabel jack pengganti dari logistik.', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-23 14:57:19.083', '2026-10-23 15:36:44.459', '2026-10-24 04:17:04.718', '2026-10-24 04:17:31.543', NULL, 0, 39, 1, 800);
INSERT INTO `tickets` VALUES ('b55fa85d-3000-422d-8395-ac02bc3fdd3c', 'TKT-20261024-0003', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 8, 'MEDIUM', 'RESOLVED', 'komputer mati ni', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-24 04:23:25.365', '2026-10-24 04:23:55.019', '2026-10-24 04:24:09.010', '2026-10-24 04:24:11.707', NULL, 0, 1, 1, 1);
INSERT INTO `tickets` VALUES ('dfee677b-7be1-41ff-b62e-4387ae751b75', 'TKT-20261023-0009', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 1, 7, 'EMERGENCY', 'RESOLVED', 'Permintaan instalasi shortcut sistem antrean triase IGD di komputer perawat 2.', '1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', '2026-10-23 14:57:19.085', '2026-10-24 04:50:54.424', '2026-10-24 04:51:00.017', '2026-10-24 04:51:03.253', NULL, 0, 834, 1, 834);
INSERT INTO `tickets` VALUES ('e2ed07b9-5079-4c2f-9983-e28a02ba0a97', 'TKT-20261023-0002', 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 2, 8, 'EMERGENCY', 'RESOLVED', 'Monitor PC intra-operatif OK Bedah 2 blank saat pergantian pasien. Kabel konektor display longgar.', 'f1112edd-8bbd-4848-addd-7d52d81a62a0', '2026-10-23 14:57:19.076', NULL, NULL, NULL, NULL, 0, 4, 16, 20);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `fullName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telegramChatId` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `role` enum('SUPERADMIN','MANAGEMENT','IT_STAFF','STAFF_USER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STAFF_USER',
  `passwordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departmentUnitId` int(11) NOT NULL,
  `failedLoginCount` int(11) NOT NULL DEFAULT 0,
  `lockedUntil` datetime(3) NULL DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `users_role_idx`(`role` ASC) USING BTREE,
  INDEX `users_departmentUnitId_idx`(`departmentUnitId` ASC) USING BTREE,
  UNIQUE INDEX `users_username_key`(`username` ASC) USING BTREE,
  INDEX `users_username_idx`(`username` ASC) USING BTREE,
  CONSTRAINT `users_departmentUnitId_fkey` FOREIGN KEY (`departmentUnitId`) REFERENCES `department_units` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('106b5b33-676d-4d16-9ba7-46e851cd58d0', 'direksi', '197805152003121002', 'Kombes Pol. dr. Martinus Ginting, Sp.P (Manajemen RSBM)', '08116000001', '', 'MANAGEMENT', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 12, 0, NULL, 1, '2026-10-23 14:57:19.060', '2026-10-24 03:36:32.816');
INSERT INTO `users` VALUES ('1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'operator', '199202022021021002', 'Operator Staf TI RSBM', '081234567891', '', 'IT_STAFF', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 11, 0, NULL, 1, '2026-10-23 11:05:37.301', '2026-10-24 04:14:58.802');
INSERT INTO `users` VALUES ('27032419-a496-4d91-b3c9-0e56884f5a10', 'manajemen', '197805152003121002', 'Kombes Pol. dr. Martinus Ginting, Sp.P (Manajemen RSBM)', '08116000001', '', 'MANAGEMENT', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 13, 0, NULL, 1, '2026-10-24 03:36:32.814', '2026-10-24 03:36:32.814');
INSERT INTO `users` VALUES ('ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'siti', '199704042023042004', 'Ns. Siti Rahma (Perawat IGD)', '081234567893', '', 'STAFF_USER', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 1, 0, NULL, 1, '2026-10-23 11:05:37.303', '2026-10-24 04:14:38.565');
INSERT INTO `users` VALUES ('d3bc3531-0abb-487c-a4c2-90d2d2535499', 'admin', '199001012020011001', 'Super Admin SIMRS', '081234567890', '', 'SUPERADMIN', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 11, 0, NULL, 1, '2026-10-23 11:05:37.298', '2026-10-24 05:08:35.340');
INSERT INTO `users` VALUES ('f1112edd-8bbd-4848-addd-7d52d81a62a0', 'rian', '199503032022031003', 'Rian Staf TI RSBM', '081234567892', '', 'IT_STAFF', '$2b$12$SsZdEtN0NIxisPxh3NvezuqL7PwegVTfydGP3z.WeJ7muRg5stzfO', 11, 0, NULL, 1, '2026-10-23 11:05:37.302', '2026-10-24 03:36:32.818');

SET FOREIGN_KEY_CHECKS = 1;
