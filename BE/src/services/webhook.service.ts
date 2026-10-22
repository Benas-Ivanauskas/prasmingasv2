import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { verifyAndParseCallback, mapPayseraStatus } from "./paysera.service.js";
import { generateAndSendForOrder } from "./documents.service.js";

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
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawCallback: parsed },
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
  const order = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", paidAt: new Date(), rawCallback: parsed },
    });
    const newStatus = updatedPayment.type === "DEPOSIT" ? "DEPOSIT_PAID" : "FULLY_PAID";
    const updatedOrder = await tx.order.update({
      where: { id: updatedPayment.orderId },
      data: { status: newStatus },
    });
    await tx.seat.updateMany({
      where: { traveller: { orderId: updatedOrder.id } },
      data: { status: "TAKEN" },
    });
    return updatedOrder;
  });

  await prisma.webhookLog.create({
    data: { payload: parsed, signatureValid: true, providerOrderId, matchedPaymentId: payment.id, processedAt: new Date() },
  });

  try {
    await generateAndSendForOrder(order.id);
  } catch (err) {
    logger.error({ err, orderId: order.id }, "generateAndSendForOrder nepavyko — webhook'as jau pilnai apdorotas");
  }
}
