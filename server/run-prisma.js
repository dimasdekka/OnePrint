const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("Running Prisma Commands...");
console.log(
  "DATABASE_URL length:",
  process.env.DATABASE_URL ? process.env.DATABASE_URL.length : "UNDEFINED",
);

try {
  console.log("Generating Client...");
  execSync("npx prisma generate", {
    stdio: "inherit",
    env: { ...process.env, PATH: process.env.PATH },
  });

  console.log("Pushing Message...");
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env, PATH: process.env.PATH },
  });

  console.log("Done!");
} catch (e) {
  console.error("Migration Failed:", e.message);
  process.exit(1);
}
