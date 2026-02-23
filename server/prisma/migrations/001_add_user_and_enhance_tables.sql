-- CreateTable User
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable Session - Add new columns
ALTER TABLE `Session` 
ADD COLUMN `userId` VARCHAR(191) NULL,
ADD COLUMN `colorMode` VARCHAR(191) NULL DEFAULT 'bw',
ADD COLUMN `paperSize` VARCHAR(191) NULL DEFAULT 'A4';

-- Add foreign key for userId in Session
ALTER TABLE `Session` 
ADD CONSTRAINT `Session_userId_fkey` 
FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Transaction - Add new columns and modify
ALTER TABLE `Transaction`
ADD COLUMN `printerId` VARCHAR(191) NULL,
ADD COLUMN `paymentStatus` VARCHAR(191) NULL DEFAULT 'pending',
ADD COLUMN `paidAt` DATETIME(3) NULL;

-- Update existing paymentStatus from status column
UPDATE `Transaction` SET `paymentStatus` = `status` WHERE `paymentStatus` IS NULL;

-- Rename status to old_status (for safety, in case we need to rollback)
-- We'll keep the old status column for now

-- Add foreign key for printerId in Transaction
ALTER TABLE `Transaction`
ADD CONSTRAINT `Transaction_printerId_fkey`
FOREIGN KEY (`printerId`) REFERENCES `Printer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Printer - Add new columns
ALTER TABLE `Printer`
ADD COLUMN `printerId` VARCHAR(191) NULL UNIQUE,
ADD COLUMN `lastSync` DATETIME(3) NULL;

-- CreateTable PrinterSettings
CREATE TABLE `PrinterSettings` (
    `id` VARCHAR(191) NOT NULL,
    `printerId` VARCHAR(191) NOT NULL,
    `pricePerPageBw` DECIMAL(10,2) NOT NULL DEFAULT 1500,
    `pricePerPageColor` DECIMAL(10,2) NOT NULL DEFAULT 3000,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PrinterSettings_printerId_key`(`printerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key for printerId in PrinterSettings
ALTER TABLE `PrinterSettings`
ADD CONSTRAINT `PrinterSettings_printerId_fkey`
FOREIGN KEY (`printerId`) REFERENCES `Printer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add initial default admin user
INSERT INTO `User` (`id`, `username`, `password`, `role`, `createdAt`, `updatedAt`) 
VALUES (
  'admin-001',
  'admin',
  '$2b$10$YJVrXIVF7fh2Kw9q.BVhkuZZKZQ.m5WIvQ1qPNxqGiDKxN3.V5vPW',
  'admin',
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `username`=`username`;

-- Add default printer settings for existing printers
INSERT INTO `PrinterSettings` (`id`, `printerId`, `pricePerPageBw`, `pricePerPageColor`, `updatedAt`)
SELECT CONCAT('ps-', `id`), `id`, 1500, 3000, NOW()
FROM `Printer`
WHERE `id` NOT IN (SELECT `printerId` FROM `PrinterSettings`);
