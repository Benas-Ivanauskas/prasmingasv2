import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PaymentType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { getCabinTypeLabel, type CabinTypeName } from "../lib/cabinLabels.js";
import { sendPaymentConfirmationEmail } from "./email.service.js";
import { toNumber } from "./order.service.js";
import { generateInvoicePdf } from "./invoice.service.js";
import { generateContractPdf } from "./contract.service.js";
import { generateTripProgramPdf } from "./travellerMemo.service.js";

const STATIC_DOCS_DIR = path.join(process.cwd(), "assets/documents/static");
const STANDARD_INFO_FORM_FILE = "standartine_informacijos_teikimo_formapdf.pdf";
const AIR_CARRIAGE_CONDITIONS_FILE = "vezimo-oru-salygos.pdf";

async function buildAttachments(
  orderId: string,
  paymentType: PaymentType,
  tripSlug: string,
  tripType: "BUS" | "FLIGHT" | "CRUISE",
): Promise<{ filename: string; content: Buffer }[]> {
  const needsContractAndProgram = paymentType !== "REMAINING";

  const [invoicePdf, contractPdf, programPdf, standardFormPdf] = await Promise.all([
    generateInvoicePdf(orderId, paymentType),
    needsContractAndProgram ? generateContractPdf(orderId) : Promise.resolve(null),
    needsContractAndProgram ? generateTripProgramPdf(tripSlug) : Promise.resolve(null),
    readFile(path.join(STATIC_DOCS_DIR, STANDARD_INFO_FORM_FILE)),
  ]);

  const attachments: { filename: string; content: Buffer }[] = [
    { filename: "isankstine-saskaita.pdf", content: invoicePdf },
    { filename: STANDARD_INFO_FORM_FILE, content: standardFormPdf },
  ];
  if (contractPdf) attachments.push({ filename: "keliones-sutartis.pdf", content: contractPdf });
  if (programPdf) attachments.push({ filename: "keliones-programa.pdf", content: programPdf });
  if (needsContractAndProgram && tripType === "FLIGHT") {
    attachments.push({
      filename: AIR_CARRIAGE_CONDITIONS_FILE,
      content: await readFile(path.join(STATIC_DOCS_DIR, AIR_CARRIAGE_CONDITIONS_FILE)),
    });
  }
  return attachments;
}

// Grąžina po vieną eilutę kiekvienam kajutės tipui — sendPaymentConfirmationEmail
// juos rodo kaip įdėtinį <ul> po "Jums rezervuota(-os)" antrašte, ne vieną
// kableliais atskirtą eilutę (sunkiau skaitoma, kai kajučių tipų daugiau nei 1).
function formatCabinBreakdown(cabinBreakdown: Array<{ type: string; qty: number }> | null | undefined): string[] | null {
  if (!cabinBreakdown || cabinBreakdown.length === 0) return null;
  return cabinBreakdown.map((c) => `${c.qty} x ${getCabinTypeLabel(c.type as CabinTypeName)}`);
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
// depozito"). PDF priedai (invoice.service.ts/contract.service.ts/
// travellerMemo.service.ts + statiniai failai) generuojami PRIEŠ siunčiant —
// jei bet kuris generavimas meta klaidą, visa funkcija klaida (fail-closed),
// `documentsSent`/`remainingDocumentsSent` lieka false, webhook'o pusėje
// klaida pagaunama nefataliai (retry vėliau).
export async function generateAndSendForOrder(orderId: string, paymentType: PaymentType): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      userEmail: true,
      totalAmount: true,
      priceSnapshot: true,
      departure: { select: { date: true, trip: { select: { title: true, slug: true, tripType: true } } } },
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
  let items: { label: string; value: string; subItems?: string[] }[];
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
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: "", subItems: cabinInfo });
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
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: "", subItems: cabinInfo });
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
    if (cabinInfo) items.push({ label: "Jums rezervuota(-os)", value: "", subItems: cabinInfo });
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

  const attachments = await buildAttachments(
    orderId,
    paymentType,
    order.departure.trip.slug,
    order.departure.trip.tripType,
  );

  await sendPaymentConfirmationEmail({ to: order.userEmail, subject, introText, items, outroParagraphs, attachments });

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
