import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { createRemainingPaymentSession } from "../services/order.service.js";
import { sendRemainingPaymentEmail } from "../services/email.service.js";

// Kas ~15 min (žr. server.ts): automatiškai siunčia likusio mokėjimo
// priminimą, kai iki Departure.date liko <= tos konkrečios Departure
// remainingPaymentDays dienų (admin'o nustatomas laukas, žr.
// AdminDepartureEditor.tsx). Riba skaičiuojama PER UŽSAKYMĄ (kiekviena
// Departure gali turėti skirtingą remainingPaymentDays), tad filtruojama
// JS pusėje po paprastos DB užklausos — kandidatų kiekis (aktyvūs
// DEPOSIT_PAID užsakymai) niekada nebus pakankamai didelis, kad reikėtų
// raw SQL.
//
// Idempotency per Order.remainingPaymentLinkSentAt — TAS PATS laukas, kurį
// naudoja ir admin'o rankinis mygtukas (adminOrder.service.ts::
// sendRemainingPaymentLink) — kuris pirmas sėkmingai išsiunčia, "užrakina"
// užsakymą nuo antro (dubliuoto) siuntimo. createRemainingPaymentSession
// (order.service.ts) yra TA PATI, be admin principal'o/AuditLog žinojimo
// skirta funkcija, kurią jau kviečia ir admin'o kelias.
export async function sendRemainingPaymentReminders(): Promise<void> {
  const candidates = await prisma.order.findMany({
    where: { status: "DEPOSIT_PAID", remainingPaymentLinkSentAt: null },
    select: {
      id: true,
      userEmail: true,
      orderNumber: true,
      departure: { select: { date: true, remainingPaymentDays: true } },
    },
  });

  const now = Date.now();
  const due = candidates.filter(
    (order) => order.departure.date.getTime() - order.departure.remainingPaymentDays * 24 * 60 * 60 * 1000 <= now,
  );

  for (const order of due) {
    try {
      const { redirectUrl, amount } = await createRemainingPaymentSession(order.id);
      await sendRemainingPaymentEmail({
        to: order.userEmail,
        orderNumber: order.orderNumber,
        amount,
        payUrl: redirectUrl,
      });
      await prisma.order.update({ where: { id: order.id }, data: { remainingPaymentLinkSentAt: new Date() } });
      logger.info({ orderId: order.id }, "Automatinis likusio mokėjimo priminimas išsiųstas");
    } catch (err) {
      logger.error(
        { err, orderId: order.id },
        "Nepavyko automatiškai išsiųsti likusio mokėjimo priminimo — bandys kitą cron'o ciklą",
      );
    }
  }
}
