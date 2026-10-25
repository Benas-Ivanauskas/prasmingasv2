import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { releaseOrderInventory } from "../services/order.service.js";

const STUCK_THRESHOLD_MS = 30 * 60 * 1000;

// Kas ~15 min (žr. server.ts cron.schedule): klientas pradėjo checkout'ą
// (vieta HELD), bet NIEKAD negavome jokio galutinio Paysera signalo —
// nei COMPLETED, nei FAILED (žr. webhook.service.ts — FAILED atveju vieta
// jau atlaisvinama IŠ KARTO, tad šis job'as pagauna TIK "visiška tyla":
// uždarytas skirtukas, niekad nepasiektas Paysera puslapis ir pan.).
//
// SĄMONINGAI PRALEIDŽIAMI admin'o rankiniu būdu sukurti PENDING_PAYMENT
// užsakymai (žr. adminOrder.service.ts::createAdminManualOrder,
// Payment.provider==="manual") — admin gali tyčia laikyti užsakymą
// "derybose" ilgiau nei 30 min (pvz. "klientas patvirtins penktadienį"),
// ir tai NĖRA tas pats "užstrigęs" atvejis, kurį šis job'as turi spręsti.
export async function expireStuckOrders(): Promise<void> {
  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: new Date(Date.now() - STUCK_THRESHOLD_MS) },
      payments: { none: { provider: "manual" } },
    },
    select: {
      id: true,
      departureId: true,
      departure: { select: { trip: { select: { tripType: true } } } },
      travellers: { select: { cabinTypeId: true, cabinIndex: true } },
    },
  });

  for (const order of staleOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED" } });
        await releaseOrderInventory(tx, order);
      });
      logger.info({ orderId: order.id }, "Užstrigęs PENDING_PAYMENT užsakymas pažymėtas EXPIRED, vieta atlaisvinta");
    } catch (err) {
      logger.error({ err, orderId: order.id }, "Nepavyko expire'inti užstrigusio užsakymo — bandys kitą cron'o ciklą");
    }
  }
}
