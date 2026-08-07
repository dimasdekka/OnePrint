const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Add your MySQL connection URL to server/.env.");
  process.exit(1);
}

console.log("Running Prisma commands for MySQL...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "configured" : "missing");

try {
  console.log("Generating Client...");
  execSync("npx prisma generate", {
    stdio: "inherit",
    env: { ...process.env, PATH: process.env.PATH },
  });

  console.log("Pushing schema...");
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env, PATH: process.env.PATH },
  });

  console.log("Done!");
} catch (e) {
  console.error("Migration Failed:", e.message);
  process.exit(1);
}
