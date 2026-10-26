import { readFileSync } from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { DocumentType, TripType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";
import { convertDocxToPdf } from "../lib/docxToPdf.js";
import { amountInWords } from "../lib/amountInWords.js";
import { getCabinTypeLabel, type CabinTypeName } from "../lib/cabinLabels.js";
import { getCabinUnitSize } from "./orderPricing.service.js";
import { getOrderDocumentData, type OrderDocumentData } from "./orderDocumentData.service.js";

export type InvoicePaymentType = "FULL" | "DEPOSIT" | "REMAINING";

const TEMPLATE_BY_PAYMENT_TYPE: Record<InvoicePaymentType, string> = {
  FULL: "isankstine_saskaita.docx",
  DEPOSIT: "isankstine_saskaita_deposit.docx",
  REMAINING: "isankstine_saskaita_remaining.docx",
};

const DOCUMENT_TYPE_BY_PAYMENT_TYPE: Record<InvoicePaymentType, DocumentType> = {
  FULL: "ADVANCE_INVOICE",
  DEPOSIT: "DEPOSIT_INVOICE",
  REMAINING: "REMAINING_INVOICE",
};

const VAT_INVOICE_TEMPLATE = "PVM_saskaita_faktura.docx";

interface CabinBreakdownEntry {
  cabinTypeId: string;
  type: CabinTypeName;
  qty: number;
  unitPrice: number;
  originalUnitPrice: number;
}

interface PriceSnapshot {
  baseUnitPrice: number;
  originalUnitPrice: number;
  departureDiscountPercent: number;
  discountCodeAmount: number;
  cabinBreakdown: CabinBreakdownEntry[] | null;
  grandTotal: number;
  depositAmount: number;
  remainingAmount: number;
  remainingDueDate: string | null;
}

interface TravellerExtra {
  extraOptionId: string;
  name: string;
  price: number;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Sąskaitos numeris priklauso UŽSAKYMUI, NE konkrečiam dokumento tipui —
// vienas pirkimas (ar apmokėtas FULL iš karto, ar DEPOSIT+REMAINING pora,
// ar vėliau dar ir post-trip VAT_INVOICE) visada yra TAS PATS, VIENAS
// numeris. (PATAISYTA 2026-10-27 — anksčiau klaidingai numeruodavo PER
// DOKUMENTO TIPĄ, tad DEPOSIT ir REMAINING tai pačiai užsakymui gaudavo DU
// SKIRTINGUS numerius — vartotojo pastebėta ir pataisyta.)
//
// Algoritmas: ieško BET KOKIO jau esančio Document šiam orderId
// (nepriklausomai nuo tipo) — jei rastas, PERIMA jo numerį (NIEKADA
// nebevykdomas naujas Trip.nextInvoiceNumber increment). Jei šis KONKRETUS
// documentType dar neturi SAVO Document audito įrašo (pvz. pirmą kartą
// generuojama VAT_INVOICE užsakymui, kuris jau turėjo DEPOSIT_INVOICE/
// REMAINING_INVOICE), sukuriamas naujas Document su TUO PAČIU numeriu —
// `upsert` pagal `@@unique([orderId, type])`, idempotentiškas pakartotiniam
// tos pačios kombinacijos kvietimui. Numeris rezervuojamas (atominis
// Trip.nextInvoiceNumber increment) TIK PIRMAM šiam orderId kada nors
// sugeneruotam dokumentui, bet kurio tipo — NIEKADA nepersiskaičiuoja, net
// jei užsakymas vėliau atšaukiamas (numeris jau "išleistas").
async function getOrCreateInvoiceNumber(
  orderId: string,
  tripId: string,
  documentType: DocumentType,
): Promise<string> {
  const existingForOrder = await prisma.document.findFirst({
    where: { orderId },
    select: { number: true },
  });

  if (existingForOrder?.number) {
    await prisma.document.upsert({
      where: { orderId_type: { orderId, type: documentType } },
      update: {},
      create: { orderId, type: documentType, number: existingForOrder.number },
    });
    return existingForOrder.number;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id: tripId },
        data: { nextInvoiceNumber: { increment: 1 } },
        select: { invoiceName: true, nextInvoiceNumber: true },
      });
      const n = updated.nextInvoiceNumber - 1; // increment grąžina NAUJĄ reikšmę
      const invoiceNumber = `${updated.invoiceName}-${String(n).padStart(2, "0")}`;
      await tx.document.create({ data: { orderId, type: documentType, number: invoiceNumber } });
      return invoiceNumber;
    });
  } catch (err) {
    // Lenktynės — kita lygiagreti užklausa tarp mūsų pirminės paieškos ir
    // šios transakcijos jau sukūrė Document šiam orderId.
    const retry = await prisma.document.findFirst({ where: { orderId }, select: { number: true } });
    if (retry?.number) {
      await prisma.document.upsert({
        where: { orderId_type: { orderId, type: documentType } },
        update: {},
        create: { orderId, type: documentType, number: retry.number },
      });
      return retry.number;
    }
    throw err;
  }
}

// Bendra per-keleivio/kupono skaičiavimo + bazinių laukų logika,
// naudojama VISŲ keturių sąskaitos variantų (FULL/DEPOSIT/REMAINING/
// VAT_INVOICE) — jie skiriasi tik šablonu, DocumentType ir papildomais
// avanso/likučio laukais (pridedami kiekvieno variantui atskirai).
// `cabinLabel` visada įtraukiamas į `users[]`, net jei konkretus šablonas
// (PVM_saskaita_faktura.docx) tokio lauko neturi — docxtemplater tyliai
// ignoruoja nepanaudotus duomenų raktus.
function buildInvoiceData(order: OrderDocumentData, snapshot: PriceSnapshot, tripType: TripType): Record<string, unknown> {
  const travellers = order.travellers;
  if (travellers.length === 0) {
    throw new ApiError(500, "Užsakymas be keleivių — sąskaitos generuoti negalima");
  }

  // 1) Kiekvieno keleivio bazinė/originali kaina + nuolaida — priklauso nuo
  // tripType (BUS/FLIGHT: viena bendra snapshot reikšmė; CRUISE: pagal jo
  // konkretų cabinTypeId iš cabinBreakdown).
  const perTraveller = travellers.map((t) => {
    let originalPrice: number;
    let baseUnitPrice: number;
    let departureDiscountPercent: number;
    let cabinLabel = "";

    if (tripType === "CRUISE") {
      const entry = (snapshot.cabinBreakdown ?? []).find((c) => c.cabinTypeId === t.cabinTypeId);
      originalPrice = entry?.originalUnitPrice ?? 0;
      baseUnitPrice = entry?.unitPrice ?? 0;
      departureDiscountPercent =
        originalPrice > 0 ? Math.round(((originalPrice - baseUnitPrice) / originalPrice) * 100) : 0;
      if (entry) {
        const label = getCabinTypeLabel(entry.type);
        cabinLabel = getCabinUnitSize(entry.type) > 1 ? `${label} — Nr. ${(t.cabinIndex ?? 0) + 1}` : label;
      }
    } else {
      originalPrice = snapshot.originalUnitPrice ?? snapshot.baseUnitPrice;
      baseUnitPrice = snapshot.baseUnitPrice;
      departureDiscountPercent = snapshot.departureDiscountPercent;
      if (tripType === "BUS") {
        cabinLabel = t.seat?.seatNumber ? `Vieta Nr. ${t.seat.seatNumber}` : "";
      }
    }

    const extras = ((t.extras as { extras?: TravellerExtra[] } | null)?.extras ?? []).slice(0, 5);
    const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
    const discountAmount = originalPrice - baseUnitPrice;
    const travellerBaseAmount = baseUnitPrice + extrasTotal;

    return {
      t,
      originalPrice,
      departureDiscountPercent,
      discountAmount,
      cabinLabel,
      extras,
      extrasTotal,
      travellerBaseAmount,
    };
  });

  // 2) Kodo nuolaidos proporcingas padalinimas (didžiausios liekanos
  // metodu) — užtikrina, kad suma TIKSLIAI sutaptų su
  // priceSnapshot.discountCodeAmount, ne tik apytiksliai.
  const discountCodeAmount = snapshot.discountCodeAmount ?? 0;
  const grandTotal = snapshot.grandTotal || 1; // apsauga nuo dalybos iš 0
  const couponShares: number[] = [];
  if (discountCodeAmount > 0) {
    let allocated = 0;
    for (let i = 0; i < perTraveller.length; i++) {
      if (i === perTraveller.length - 1) {
        couponShares.push(Math.round((discountCodeAmount - allocated) * 100) / 100);
      } else {
        const share = Math.round(discountCodeAmount * (perTraveller[i].travellerBaseAmount / grandTotal) * 100) / 100;
        couponShares.push(share);
        allocated += share;
      }
    }
  } else {
    perTraveller.forEach(() => couponShares.push(0));
  }

  const users = perTraveller.map((p, i) => {
    const couponDiscount = couponShares[i];
    const couponDiscountPercent =
      p.travellerBaseAmount > 0 ? Math.round((couponDiscount / p.travellerBaseAmount) * 100) : 0;
    const price = p.originalPrice - p.discountAmount - couponDiscount + p.extrasTotal;
    return {
      name: `${p.t.firstName} ${p.t.lastName}`,
      cabinLabel: p.cabinLabel,
      originalPrice: p.originalPrice.toFixed(2),
      tripDiscountPercent: String(p.departureDiscountPercent),
      discountAmount: p.discountAmount.toFixed(2),
      couponDiscountPercent: String(couponDiscountPercent),
      couponDiscount: couponDiscount.toFixed(2),
      extraOptions: p.extras.map((e) => ({ extraName: e.name, extraPrice: e.price.toFixed(2) })),
      price: price.toFixed(2),
    };
  });

  const total = users.reduce((sum, u) => sum + Number(u.price), 0);
  const mainTraveller = travellers[0];

  const tripReturnDate = new Date(order.departure.date);
  tripReturnDate.setDate(tripReturnDate.getDate() + order.departure.durationDays);

  return {
    mainTravellersName: `${mainTraveller.firstName} ${mainTraveller.lastName}`,
    mainNumber: order.userPhone ?? "",
    mainEmail: order.userEmail,
    mainAddress: order.city ?? "",
    tripName: order.departure.trip.title,
    numberOfCust: travellers.length,
    tripDate: formatDate(order.departure.date),
    tripCountry: order.departure.trip.destinationCountry,
    tripReturn: formatDate(tripReturnDate),
    users,
    total: total.toFixed(2),
    vat: "0.00",
    amountText: amountInWords(total),
  };
}

async function renderInvoiceDocx(templateFile: string, data: Record<string, unknown>): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "assets/documents/static", templateFile);
  const content = readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}

export async function generateInvoicePdf(orderId: string, paymentType: InvoicePaymentType): Promise<Buffer> {
  const order = await getOrderDocumentData(orderId);
  const snapshot = order.priceSnapshot as unknown as PriceSnapshot;
  const tripType = order.departure.trip.tripType;

  const data = buildInvoiceData(order, snapshot, tripType);
  data.date = formatDate(new Date());
  data.orderNumber = order.orderNumber;

  if (paymentType === "DEPOSIT" || paymentType === "REMAINING") {
    const depositAmount = snapshot.depositAmount ?? 0;
    const remainingAmount = snapshot.remainingAmount ?? 0;
    data.depositAmount = depositAmount.toFixed(2);
    data.depositAmountText = amountInWords(depositAmount);
    data.remainingAmount = remainingAmount.toFixed(2);
    data.remainingAmountText = amountInWords(remainingAmount);
    if (paymentType === "DEPOSIT" && snapshot.remainingDueDate) {
      data.remainingPaymentDate = formatDate(new Date(snapshot.remainingDueDate));
    }
  }

  // Numeris rezervuojamas TIK PO sėkmingo šablono užpildymo (render() jau
  // nemestų klaidos) — išvengiama "sudegintų" numerių, jei duomenys
  // netinka šablonui. FULL/DEPOSIT/REMAINING šablonai neturi atskiros
  // žymės numeriui rodyti (tik orderNumber) — invoiceNumber kol kas
  // saugomas TIK Document.number DB stulpelyje, audito/sekimo tikslams.
  const docxBuffer = await renderInvoiceDocx(TEMPLATE_BY_PAYMENT_TYPE[paymentType], data);
  const invoiceNumber = await getOrCreateInvoiceNumber(
    orderId,
    order.departure.trip.id,
    DOCUMENT_TYPE_BY_PAYMENT_TYPE[paymentType],
  );
  logger.info({ orderId, paymentType, invoiceNumber }, "Sąskaitos numeris rezervuotas");

  return convertDocxToPdf(docxBuffer);
}

// PVM sąskaita faktūra — siunčiama NE apmokėjimo metu (žr. jobs/
// sendVatInvoices.job.ts), o kitą dieną po kelionės pabaigos. Skirtingai
// nuo FULL/DEPOSIT/REMAINING, šis šablonas TURI atskirą `{invoiceTitle}`
// žymę sąskaitos numeriui rodyti.
export async function generateVatInvoicePdf(orderId: string): Promise<Buffer> {
  const order = await getOrderDocumentData(orderId);
  const snapshot = order.priceSnapshot as unknown as PriceSnapshot;
  const tripType = order.departure.trip.tripType;

  const data = buildInvoiceData(order, snapshot, tripType);
  data.date = formatDate(new Date());
  data.orderNumber = order.orderNumber;

  // Skirtingai nuo FULL/DEPOSIT/REMAINING (kur numeris niekur PDF'e
  // nerodomas, tad gali būti rezervuotas PO render'inimo), čia
  // `{invoiceTitle}` turi būti žinomas PRIEŠ render'inant — tad numeris
  // rezervuojamas PIRMA. `buildInvoiceData()` naudoja TĄ PAČIĄ, jau
  // produkcijoje patikrintą logiką kaip FULL/DEPOSIT/REMAINING, tad
  // render'inimo klaidos rizika čia nedidesnė nei ten.
  const invoiceNumber = await getOrCreateInvoiceNumber(orderId, order.departure.trip.id, "VAT_INVOICE");
  logger.info({ orderId, invoiceNumber }, "PVM sąskaitos numeris rezervuotas");

  data.invoiceTitle = invoiceNumber;
  const docxBuffer = await renderInvoiceDocx(VAT_INVOICE_TEMPLATE, data);
  return convertDocxToPdf(docxBuffer);
}
