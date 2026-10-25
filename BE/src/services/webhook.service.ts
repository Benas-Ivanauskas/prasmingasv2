import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import { verifyAndParseCallback, mapPayseraStatus } from "./paysera.service.js";
import { generateAndSendForOrder } from "./documents.service.js";
import { releaseOrderInventory, toNumber } from "./order.service.js";

const EXPECTED_CURRENCY = "EUR";

// Kiekvienas gaunamas Paysera callback įrašomas WebhookLog'e PIRMIAUSIA,
// prieš bandant susieti su Payment — taip nedingsta pėdsakas, jei parašas
// neteisingas, orderid nežinomas, arba apdorojimas numeta klaidą. Visa ši
// funkcija kviečiama FIRE-AND-FORGET po to, kai controller'is jau atsakė
// "OK" — klaida čia niekada nebegali paveikti HTTP atsakymo.
export async function processPayseraCallback(data: string, ss1: string): Promise<void> {
  let parsed: Record<string, string>;
  try {
    parsed = verifyAndParseCallback(data, ss1);
  } catch (err) {
    await prisma.webhookLog.create({
      data: {
        payload: { data, ss1 },
        signatureValid: false,
        error: err instanceof Error ? err.message : "Neteisingas parašas",
      },
    });
    return;
  }

  const providerOrderId = parsed.orderid ?? null;
  const payment = providerOrderId
    ? await prisma.payment.findUnique({ where: { providerOrderId } })
    : null;

  if (!payment) {
    await prisma.webhookLog.create({
      data: { payload: parsed, signatureValid: true, providerOrderId, error: "Payment nerastas pagal providerOrderId" },
    });
    return;
  }

  // Defense-in-depth — parašas jau patvirtina, kad callback'as pasirašytas
  // MŪSŲ PAYSERA_SIGN_PASSWORD (apsaugo nuo išorinio klastojimo), bet
  // IKI ŠIOL niekada netikrinome, ar paties callback'o amount/currency/
  // projectid realiai sutampa su TUO Payment įrašu, su kuriuo jį susiejame
  // pagal providerOrderId. Jei nesutampa — parašas vis tiek galioja, bet
  // DUOMENYS nebeatitinka to, ko tikimės (Paysera pusės keistas edge
  // case'as/klaida, ar bandymas panaudoti seną/kito projekto callback'ą) —
  // nebepasitikima `status` lauku, žymima ANOMALIJA, TOLIAU NEAPDOROJAMA.
  const expectedAmountCents = Math.round(toNumber(payment.amount) * 100);
  const receivedAmountCents = Number(parsed.amount);
  const mismatches: string[] = [];
  if (parsed.projectid !== env.paysera.projectId) {
    mismatches.push(`projectid: tikėtasi "${env.paysera.projectId}", gauta "${parsed.projectid}"`);
  }
  if (parsed.currency !== EXPECTED_CURRENCY) {
    mismatches.push(`currency: tikėtasi "${EXPECTED_CURRENCY}", gauta "${parsed.currency}"`);
  }
  if (!Number.isFinite(receivedAmountCents) || receivedAmountCents !== expectedAmountCents) {
    mismatches.push(`amount: tikėtasi ${expectedAmountCents} centų, gauta "${parsed.amount}"`);
  }
  if (mismatches.length > 0) {
    await prisma.webhookLog.create({
      data: {
        payload: parsed,
        signatureValid: true,
        providerOrderId,
        matchedPaymentId: payment.id,
        processedAt: new Date(),
        error: `ANOMALIJA: parašas galioja, bet callback'o duomenys NESUTAMPA su tikėtu Payment įrašu — ${mismatches.join("; ")}. REIKALINGAS RANKINIS patikrinimas.`,
      },
    });
    logger.error(
      { providerOrderId, paymentId: payment.id, mismatches },
      "Paysera webhook'o amount/currency/projectid nesutampa su tikėtu Payment įrašu — galimas rimtas duomenų neatitikimas",
    );
    return;
  }

  // Idempotency — Paysera gali atsiųsti webhook'ą daugiau nei kartą tam
  // pačiam įvykiui. Jei jau COMPLETED, tai pakartotas pristatymas, ne
  // naujas įvykis — NEI Order/Seat statusas, NEI dokumentai nebeapdorojami
  // antrą kartą.
  if (payment.status === "COMPLETED") {
    await prisma.webhookLog.create({
      data: {
        payload: parsed,
        signatureValid: true,
        providerOrderId,
        matchedPaymentId: payment.id,
        processedAt: new Date(),
        error: "Pakartotas webhook jau COMPLETED Payment'ui — ignoruojama",
      },
    });
    return;
  }

  const mappedStatus = mapPayseraStatus(parsed.status ?? "");

  if (mappedStatus === "FAILED") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", rawCallback: parsed },
      });

      // Jei šis nepavykęs mokėjimas buvo Order'o PIRMASIS (FULL/DEPOSIT) —
      // Order'as VIS DAR bus PENDING_PAYMENT (niekad iš jo neišėjęs). Tai
      // GALUTINIS, tikras signalas, kad vieta daugiau nebereikalinga: FE
      // neturi jokio "bandyti dar kartą ŠIAM užsakymui" kelio — klientas bet
      // kuriuo atveju pradėtų iš naujo nuo Step 1 (naujas Order/hold). Tad
      // atlaisviname IŠ KARTO, nelaukdami Fazės 8 30 min cron'o. JEI tai
      // nepavykęs REMAINING apmokėjimas, Order'as jau bus DEPOSIT_PAID (ne
      // PENDING_PAYMENT) — šis patikrinimas JO natūraliai neliečia, nes
      // nepavykęs likutis NETURI atšaukti jau apmokėto depozito užsakymo.
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: {
          id: true,
          status: true,
          departureId: true,
          departure: { select: { trip: { select: { tripType: true } } } },
          travellers: { select: { cabinTypeId: true, cabinIndex: true } },
        },
      });
      if (order && order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED" } });
        await releaseOrderInventory(tx, order);
      }
    });
    await prisma.webhookLog.create({
      data: { payload: parsed, signatureValid: true, providerOrderId, matchedPaymentId: payment.id, processedAt: new Date() },
    });
    return;
  }

  if (mappedStatus === "PENDING") {
    // Priimta, dar nevykdyta — tiesiog laukiame kito webhook'o su galutiniu statusu.
    await prisma.webhookLog.create({
      data: { payload: parsed, signatureValid: true, providerOrderId, matchedPaymentId: payment.id, processedAt: new Date() },
    });
    return;
  }

  // COMPLETED — viena transakcija: Payment patvirtinamas, Order statusas
  // pereina pagal Payment.type (DEPOSIT → DEPOSIT_PAID, FULL/REMAINING →
  // FULLY_PAID), Seat HELD→TAKEN. CabinType.takenUnits/flightSeatsTaken
  // NEKEIČIAMI čia — jau padidinti checkout metu (Fazė 5); webhook'as tik
  // patvirtina nuosavybę, ne talpą.
  //
  // SAUGIKLIS NUO CRON/CALLBACK LENKTYNĖS: jei mokėjimas atkeliauja PER
  // VĖLAI (Order'as tarp checkout'o ir šio webhook'o jau buvo expire'intas
  // Fazės 8 cron'o arba atšauktas admin'o — vieta galimai jau atiduota
  // KITAM klientui), NETRANSFORMUOJAME Order/Seat būsenos aklai. Pinigai
  // VIS TIEK realiai atkeliavo — Payment VISADA pažymimas COMPLETED (faktas
  // niekada nepamestamas), bet Order/Seat pakeičiami TIK jei Order dar yra
  // teisingoje "laukiančioje" būsenoje tam Payment.type: PENDING_PAYMENT
  // FULL/DEPOSIT'ui, DEPOSIT_PAID REMAINING'ui. Priešingu atveju — aiški
  // ANOMALIJA WebhookLog'e, kad administratorius spręstų rankiniu būdu
  // (grąžinimas arba naujos vietos paieška klientui).
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    const expectedPriorStatus = payment.type === "REMAINING" ? "DEPOSIT_PAID" : "PENDING_PAYMENT";

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", paidAt: new Date(), rawCallback: parsed },
    });

    if (current.status !== expectedPriorStatus) {
      return { order: null, anomaly: current.status };
    }

    const newStatus = updatedPayment.type === "DEPOSIT" ? "DEPOSIT_PAID" : "FULLY_PAID";
    const updatedOrder = await tx.order.update({
      where: { id: updatedPayment.orderId },
      data: { status: newStatus },
    });
    await tx.seat.updateMany({
      where: { traveller: { orderId: updatedOrder.id } },
      data: { status: "TAKEN" },
    });
    return { order: updatedOrder, anomaly: null };
  });

  if (!result.order) {
    await prisma.webhookLog.create({
      data: {
        payload: parsed,
        signatureValid: true,
        providerOrderId,
        matchedPaymentId: payment.id,
        processedAt: new Date(),
        error: `ANOMALIJA: mokėjimas realiai gautas (Payment pažymėtas COMPLETED), bet Order jau buvo "${result.anomaly}" (ne laukiama būsena) — vieta galimai jau atiduota kitam klientui. REIKALINGAS RANKINIS administratoriaus sprendimas (grąžinimas arba naujos vietos paieška).`,
      },
    });
    logger.error(
      { orderId: payment.orderId, paymentId: payment.id, orderStatus: result.anomaly },
      "Paysera COMPLETED webhook atkeliavo per vėlai — Order jau nebe laukiamoje būsenoje, reikalingas rankinis sprendimas",
    );
    return;
  }

  await prisma.webhookLog.create({
    data: { payload: parsed, signatureValid: true, providerOrderId, matchedPaymentId: payment.id, processedAt: new Date() },
  });

  try {
    await generateAndSendForOrder(result.order.id, payment.type);
  } catch (err) {
    logger.error({ err, orderId: result.order.id }, "generateAndSendForOrder nepavyko — webhook'as jau pilnai apdorotas");
  }
}
