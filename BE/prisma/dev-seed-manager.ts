import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const passwordHash = await bcrypt.hash("manager12345", 10);
  await prisma.admin.upsert({
    where: { email: "manager@prasmingas.lt" },
    update: {},
    create: { email: "manager@prasmingas.lt", passwordHash, role: "MANAGER" },
  });
  console.log("manager ready");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
