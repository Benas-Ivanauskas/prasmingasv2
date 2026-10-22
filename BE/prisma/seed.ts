import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@prasmingas.lt";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} jau egzistuoja — praleidžiama.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { email, passwordHash, role: "ADMIN" },
  });

  console.log(`Sukurtas admin: ${email} / ${password} (pakeiskite slaptažodį po pirmo prisijungimo).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
