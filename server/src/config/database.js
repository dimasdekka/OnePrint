const { PrismaClient } = require("@prisma/client");

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot reload
 */
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }
  prisma = global.prisma;
}

/**
 * Graceful shutdown handler
 */
const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
};

module.exports = { prisma, disconnectDatabase };
