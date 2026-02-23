-- Add File table to track uploaded files
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `filepath` VARCHAR(255) NOT NULL,
    `totalPages` INT NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `File_sessionId_fkey` (`sessionId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `File_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
