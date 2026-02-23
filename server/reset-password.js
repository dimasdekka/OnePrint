const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();

  if (users.length > 0) {
    const admin = users[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });
    console.log(`Updated user ${admin.username} password to admin123`);
  }
}
main().finally(() => prisma.$disconnect());
