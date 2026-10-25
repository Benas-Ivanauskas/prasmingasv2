import type { PaymentType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { sendPaymentConfirmationEmail } from "./email.service.js";
import { toNumber } from "./order.service.js";

type CabinTypeName = "QUAD" | "DOUBLE" | "TRIPLE";

// Tas pats tekstas kaip FE tripHelpers.ts::getCabinTypeLabel — laikoma
// atskirai BE pusėje, nes FE/BE nesidalina kodu.
function getCabinTypeLabel(type: CabinTypeName): string {
  switch (type) {
    case "DOUBLE":
      return "Dvivietė kajutė be lango";
    case "TRIPLE":
      return "Trivietė kajutė be lango";
    case "QUAD":
    default:
      return "Vieta keturvietėje kajutėje be lango";
  }
}

function formatCabinBreakdown(cabinBreakdown: Array<{ type: string; qty: number }> | null | undefined): string | null {
  if (!cabinBreakdown || cabinBreakdown.length === 0) return null;
  return cabinBreakdown.map((c) => `${c.qty} x ${getCabinTypeLabel(c.type as CabinTypeName)}`).join(", ");
}

interface PriceSnapshot {
  finalTotal?: number;
  depositAmount?: number;
  remainingAmount?: number;
  remainingDueDate?: string | null;
  cabinBreakdown?: Array<{ type: string; qty: number }> | null;
}

// Webhook'as (vienintelis kvietėjas šiuo metu — žr. webhook.service.ts) kviečia
// iškart po sėkmingos Order/Seat transakcijos, perduodamas TĄ Payment.type,
// kuris KĄ TIK buvo patvirtintas (o ne iš naujo sprendžia iš Order.status, nes
// FULLY_PAID vienodai reiškia ir "apmokėta iš karto", ir "apmokėtas likutis po
// depozito"). NIEKADA nekuria Document įrašo — schema.prisma::Document.fileUrl
// yra privalomas (realaus PDF/blob URL dar nėra), tai lieka PDF fazei.
export async function generateAndSendForOrder(orderId: string, paymentType: PaymentType): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      userEmail: true,
      totalAmount: true,
      priceSnapshot: true,
      departure: { select: { date: true, trip: { select: { title: true, tripType: true } } } },
      payments: { where: { type: paymentType, status: "COMPLETED" }, orderBy: { paidAt: "desc" }, take: 1 },
    },
  });

  const snapshot = order.priceSnapshot as PriceSnapshot;
  const tripName = order.departure.trip.title;
  const dateText = order.departure.date.toISOString().split("T")[0];
  const cabinInfo =
    order.departure.trip.tripType === "CRUISE" ? formatCabinBreakdown(snapshot.cabinBreakdown) : null;
  const thisPayment = order.payments[0];

  let subject: string;
  let introText: string;
  let items: { label: string; value: string }[];
  let outroParagraphs: string[] = [];

  if (paymentType === "FULL") {
    subject = `Apmokėjimo patvirtinimas už kelionę ${tripName}`;
    introText =
      "Dėkojame, kad pasirinkote keliauti su mumis! Patvirtiname jūsų rezervaciją ir siunčiame kelionės dokumentus.";
    items = [
      { label: "Kelionė", value: tripName },
      { label: "Data", value: dateText },
      { label: "Suma", value: `${toNumber(order.totalAmount).toFixed(2)} €` },
    ];
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: cabinInfo });
    outroParagraphs = ["Jei turite kokių nors klausimų, nedvejodami susisiekite su mumis.", "Geros kelionės!"];
  } else if (paymentType === "DEPOSIT") {
    const depositAmount = thisPayment ? toNumber(thisPayment.amount) : (snapshot.depositAmount ?? 0);
    const remainingAmount = snapshot.remainingAmount ?? 0;
    const dueDateText = snapshot.remainingDueDate ? snapshot.remainingDueDate.split("T")[0] : "nenurodyta";
    subject = `Avanso apmokėjimo patvirtinimas kelionei ${tripName}`;
    introText = "Jūsų avansas už kelionę buvo sėkmingai apmokėtas.";
    items = [
      { label: "Kelionė", value: tripName },
      { label: "Data", value: dateText },
      { label: "Sumokėta avanso suma", value: `${depositAmount.toFixed(2)} €` },
    ];
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: cabinInfo });
    items.push({ label: "Likusi suma", value: `${remainingAmount.toFixed(2)} €` });
    items.push({ label: "Likusią sumą reikia sumokėti iki", value: dueDateText });
    outroParagraphs = [
      "Atsiųsime mokėjimo nuorodą jūsų nurodytu el. paštu.",
      "Dėkojame, kad pasirinkote mūsų kelionę!",
    ];
  } else {
    // REMAINING
    const thisPaymentAmount = thisPayment ? toNumber(thisPayment.amount) : 0;
    subject = `Likusios sumos apmokėjimo patvirtinimas už kelionę ${tripName}`;
    introText = "Likusi suma už kelionę buvo sėkmingai apmokėta.";
    items = [
      { label: "Kelionė", value: tripName },
      { label: "Data", value: dateText },
      { label: "Suma", value: `${toNumber(order.totalAmount).toFixed(2)} €` },
      { label: "Sumokėtas avansas", value: `${(snapshot.depositAmount ?? 0).toFixed(2)} €` },
      { label: "Sumokėta likusi suma", value: `${thisPaymentAmount.toFixed(2)} €` },
    ];
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: cabinInfo });
  }

  // documentAttempts skaičiuojamas TIK FULL/DEPOSIT šakai (schema.prisma turi
  // tik VIENĄ bendrą attempts lauką, susietą su documentsSent komentare) —
  // žymimas PRIEŠ bandant siųsti, kad būsimas retry cron'as (Fazė 8, dar
  // neįgyvendintas) galėtų skaičiuoti nesėkmingus bandymus. REMAINING naudoja
  // atskirą remainingDocumentsSent flag'ą be attempts skaitiklio (schema
  // tokio lauko neturi).
  if (paymentType !== "REMAINING") {
    await prisma.order.update({ where: { id: orderId }, data: { documentAttempts: { increment: 1 } } });
  }

  await sendPaymentConfirmationEmail({ to: order.userEmail, subject, introText, items, outroParagraphs });

  // Žymima true TIK PO sėkmingo išsiuntimo (žr. schema.prisma komentarą) —
  // jei sendMail() aukščiau meta klaidą, šis update'as nepasiekiamas, abu
  // flag'ai lieka false/nepakeisti, kvietėjas (webhook.service.ts) klaidą
  // pagauna nefataliai.
  await prisma.order.update({
    where: { id: orderId },
    data: paymentType === "REMAINING" ? { remainingDocumentsSent: true } : { documentsSent: true },
  });

  logger.info({ orderId, paymentType }, "Patvirtinimo laiškas sėkmingai išsiųstas");
}
