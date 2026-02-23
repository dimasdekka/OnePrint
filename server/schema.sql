-- CreateTable User
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL UNIQUE,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Session (Updated)
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `kioskId` VARCHAR(191) NULL,
    `socketId` VARCHAR(191) NULL,
    `fileId` VARCHAR(191) NULL,
    `copies` INT NOT NULL DEFAULT 1,
    `colorMode` VARCHAR(191) NULL DEFAULT 'bw',
    `pageRange` VARCHAR(191) NULL DEFAULT 'all',
    `pageCount` INT NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'waiting',
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Session_userId_fkey` (`userId`),
    UNIQUE INDEX `Session_fileId_key` (`fileId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `Session_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Transaction (Updated)
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `printerId` VARCHAR(191) NULL,
    `midtransToken` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NOT NULL UNIQUE,
    `paymentStatus` VARCHAR(191) NULL DEFAULT 'pending',
    `amount` INT NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Transaction_sessionId_fkey` (`sessionId`),
    INDEX `Transaction_printerId_fkey` (`printerId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Transaction_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Transaction_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `Printer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Printer (Updated)
CREATE TABLE `Printer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `printerId` VARCHAR(191) NULL UNIQUE,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Offline',
    `driver` VARCHAR(191) NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT true,
    `lastSync` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable PrinterSettings
CREATE TABLE `PrinterSettings` (
    `id` VARCHAR(191) NOT NULL,
    `printerId` VARCHAR(191) NOT NULL UNIQUE,
    `pricePerPageBw` DECIMAL(10,2) NOT NULL DEFAULT 1500,
    `pricePerPageColor` DECIMAL(10,2) NOT NULL DEFAULT 3000,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    CONSTRAINT `PrinterSettings_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `Printer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable File
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `filepath` VARCHAR(255) NOT NULL,
    `totalPages` INT NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
