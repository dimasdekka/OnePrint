const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  console.dir(users, { depth: null });

  if (users.length > 0) {
    const isMatch = await bcrypt.compare("admin123", users[0].password);
    console.log("Password 'admin123' matches first user?", isMatch);
  }
}
main().finally(() => prisma.$disconnect());
