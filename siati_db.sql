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

 Date: 23/10/2026 18:22:23
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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, 'SIMRS & Rekam Medis (RME)', 'Error bridging BPJS, gagal simpan rekam medis, akun error', 15);
INSERT INTO `categories` VALUES (2, 'Printer Label & Resep', 'Kertas macet (paper jam), hasil bergaris, printer resep mati', 20);
INSERT INTO `categories` VALUES (3, 'Hardware & PC Ruangan', 'PC mati total, monitor blank, scanner barcode tidak terbaca', 30);
INSERT INTO `categories` VALUES (4, 'Jaringan LAN & WiFi Medis', 'Koneksi internet putus, kabel LAN copot, RME offline', 20);
INSERT INTO `categories` VALUES (5, 'Fasilitas Penunjang TI', 'Telepon internal PABX mati, CCTV ruangan, UPS bunyi terus', 45);

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
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_audit_logs
-- ----------------------------
INSERT INTO `system_audit_logs` VALUES (1, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 11:13:19.845');
INSERT INTO `system_audit_logs` VALUES (2, 'd3bc3531-0abb-487c-a4c2-90d2d2535499', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"SUPERADMIN\"}', '2026-10-23 11:20:11.524');
INSERT INTO `system_audit_logs` VALUES (3, 'ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'LOGIN_SUCCESS', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '{\"role\":\"STAFF_USER\"}', '2026-10-23 11:20:36.382');

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
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ticket_timeline_logs
-- ----------------------------

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
  `role` enum('SUPERADMIN','MANAGEMENT','HELPDESK','TECHNICIAN','STAFF_USER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STAFF_USER',
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
INSERT INTO `users` VALUES ('1a2ab84b-b8fb-4ef7-b32d-0cd9260c9ccb', 'operator', '199202022021021002', 'Operator Dispatcher IT', '081234567891', '', 'HELPDESK', '$2b$12$jS5FTD064a6zNDDHvwY/DeNk.czoLter6TUAHIYacGOFLaEfTu46e', 11, 0, NULL, 1, '2026-10-23 11:05:37.301', '2026-10-23 11:05:37.301');
INSERT INTO `users` VALUES ('ce3f8e68-4bee-41c4-9201-01d7ae6d8236', 'siti', '199704042023042004', 'Ns. Siti Rahma (Perawat IGD)', '081234567893', '', 'STAFF_USER', '$2b$12$jS5FTD064a6zNDDHvwY/DeNk.czoLter6TUAHIYacGOFLaEfTu46e', 1, 0, NULL, 1, '2026-10-23 11:05:37.303', '2026-10-23 11:20:36.364');
INSERT INTO `users` VALUES ('d3bc3531-0abb-487c-a4c2-90d2d2535499', 'admin', '199001012020011001', 'Super Admin SIMRS', '081234567890', '', 'SUPERADMIN', '$2b$12$jS5FTD064a6zNDDHvwY/DeNk.czoLter6TUAHIYacGOFLaEfTu46e', 11, 0, NULL, 1, '2026-10-23 11:05:37.298', '2026-10-23 11:20:11.509');
INSERT INTO `users` VALUES ('f1112edd-8bbd-4848-addd-7d52d81a62a0', 'rian', '199503032022031003', 'Rian Teknisi Lapangan', '081234567892', '', 'TECHNICIAN', '$2b$12$jS5FTD064a6zNDDHvwY/DeNk.czoLter6TUAHIYacGOFLaEfTu46e', 11, 0, NULL, 1, '2026-10-23 11:05:37.302', '2026-10-23 11:05:37.302');

SET FOREIGN_KEY_CHECKS = 1;
