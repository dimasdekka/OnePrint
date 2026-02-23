const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

async function initializeAdminUser() {
  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      logger.info("No users found. Creating default admin user...");

      // Required for hashing default password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await prisma.user.create({
        data: {
          username: "admin",
          password: hashedPassword,
        },
      });

      logger.info(
        "Default admin user created successfully -> Username: admin, Password: admin123",
      );
    }
  } catch (error) {
    logger.error("Failed to initialize admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  initializeAdminUser,
};
