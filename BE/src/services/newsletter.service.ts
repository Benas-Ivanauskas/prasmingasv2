import { prisma } from "../lib/prisma.js";
import { csvRow, toCsvDocument } from "../lib/csv.js";

// Upsert, ne create — pakartotinas prenumeravimas tuo pačiu el. paštu yra
// tylus sėkmingas no-op (subscribedAt NEperrašomas), ne klaida. Taip
// NEpasako užpuolikui, ar tas el. paštas jau prenumeruoja (tas pats
// principas kaip discount.service.ts'o bendras "nerastas/neaktyvus"
// klaidos pranešimas).
export async function subscribeToNewsletter(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    create: { email: normalized },
    update: {},
  });
}

export async function exportNewsletterCsv(): Promise<string> {
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "asc" } });

  const rows = [csvRow(["El. paštas", "Užsiprenumeravo"])];
  for (const s of subscribers) {
    rows.push(csvRow([s.email, s.subscribedAt.toISOString().slice(0, 10)]));
  }

  return toCsvDocument(rows);
}
