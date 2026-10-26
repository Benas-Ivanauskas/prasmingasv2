import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { generateVatInvoicePdf } from "../services/invoice.service.js";
import { sendVatInvoiceEmail } from "../services/email.service.js";

// Kas dieną (žr. server.ts): PVM sąskaita faktūra siunčiama NE apmokėjimo
// metu, o KITĄ DIENĄ po kelionės pabaigos (departure.date + durationDays) —
// paslauga laikoma "parduota" tik ją realiai suteikus. Tas pats raštas kaip
// sendRemainingPaymentReminders.job.ts: platus Prisma query, datos sąlyga
// filtruojama JS pusėje (kandidatų kiekis visad mažas), try/catch PER
// užsakymą (klaida vieno neblokuoja kitų, kitas cron'o ciklas pabandys
// dar kartą), žymima vatInvoiceSent=true TIK po sėkmės.
export async function sendVatInvoices(): Promise<void> {
  const candidates = await prisma.order.findMany({
    where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] }, wantsInvoice: true, vatInvoiceSent: false },
    select: {
      id: true,
      userEmail: true,
      departure: { select: { date: true, durationDays: true, trip: { select: { title: true } } } },
    },
  });

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const due = candidates.filter(
    (o) => o.departure.date.getTime() + o.departure.durationDays * ONE_DAY < now - ONE_DAY,
  );

  for (const order of due) {
    try {
      const pdf = await generateVatInvoicePdf(order.id);
      await sendVatInvoiceEmail({ to: order.userEmail, tripName: order.departure.trip.title, attachment: pdf });
      await prisma.order.update({ where: { id: order.id }, data: { vatInvoiceSent: true } });
      logger.info({ orderId: order.id }, "PVM sąskaita faktūra automatiškai išsiųsta");
    } catch (err) {
      logger.error(
        { err, orderId: order.id },
        "Nepavyko automatiškai išsiųsti PVM sąskaitos — bandys kitą cron'o ciklą",
      );
    }
  }
}
