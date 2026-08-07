-- PostgreSQL/Supabase schema reference for OnePrint.
-- Prefer `npm run db:push` from the server folder so Prisma owns the schema.

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Printer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "printerId" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Offline',
    "driver" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Printer_name_key" ON "Printer"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Printer_printerId_key" ON "Printer"("printerId");

CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "filepath" VARCHAR(255) NOT NULL,
    "totalPages" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kioskId" TEXT,
    "socketId" TEXT,
    "fileId" TEXT,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "colorMode" TEXT DEFAULT 'color',
    "pageRange" TEXT DEFAULT 'all',
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Session_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_fileId_key" ON "Session"("fileId");

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "printerId" TEXT,
    "midtransToken" TEXT,
    "orderId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_orderId_key" ON "Transaction"("orderId");

CREATE TABLE IF NOT EXISTS "PrinterSettings" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "pricePerPageBw" DECIMAL(65,30) NOT NULL DEFAULT 1500,
    "pricePerPageColor" DECIMAL(65,30) NOT NULL DEFAULT 3000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrinterSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrinterSettings_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrinterSettings_printerId_key" ON "PrinterSettings"("printerId");
