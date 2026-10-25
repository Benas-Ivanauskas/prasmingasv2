import { prisma } from "../lib/prisma.js";
import { toNumber } from "./order.service.js";

const CSV_COLUMNS = [
  "Užsakymo nr.",
  "Vardas",
  "Pavardė",
  "Gimimo data",
  "Telefonas",
  "El. paštas",
  "Miestas",
  "Įlipimo vieta",
  "Vieta",
  "Suma (€)",
  "Avansas",
  "Pastabos",
  "Avanso suma (€)",
  "Likutis sumokėtas (€)",
  "Pilna apmokėta suma (€)",
  "Papildoma parinktis 1",
  "Papildoma parinktis 2",
  "Papildoma parinktis 3",
  "Papildoma parinktis 4",
  "Papildoma parinktis 5",
] as const;

interface PriceSnapshot {
  baseUnitPrice?: number;
  depositAmount?: number;
  payingDeposit?: boolean;
  cabinBreakdown?: Array<{ cabinTypeId: string; unitPrice: number }> | null;
}

interface TravellerExtra {
  extraOptionId: string;
  name: string;
  price: number;
}

// RFC4180 stiliaus — kabutėmis apgaubiama TIK kai reikia (yra kablelis/
// kabutė/eilutės lūžis), vidinės kabutės dvigubinamos.
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(values: string[]): string {
  return values.map(csvCell).join(",");
}

// Vienas keleivis = viena eilutė. Order-lygio stulpeliai (Avansas/Pastabos/
// Avanso suma/Likutis/Pilna suma) kartojasi identiškai kiekvienoje to
// paties užsakymo keleivio eilutėje — tyčia, patogiau buhalterijai/
// filtravimui Excel'yje nei viena suvestinė eilutė per užsakymą.
export async function exportDepartureTravellersCsv(departureId: string): Promise<string> {
  const orders = await prisma.order.findMany({
    where: {
      departureId,
      status: { in: ["PENDING_PAYMENT", "DEPOSIT_PAID", "FULLY_PAID"] },
    },
    include: {
      travellers: { include: { seat: true }, orderBy: { id: "asc" } },
      payments: { select: { type: true, status: true, amount: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [csvRow([...CSV_COLUMNS])];

  for (const order of orders) {
    const snapshot = order.priceSnapshot as PriceSnapshot;
    const payingDeposit = snapshot.payingDeposit ?? false;
    const depositAmountText = payingDeposit ? (snapshot.depositAmount ?? 0).toFixed(2) : "";
    const remainingPayment = order.payments.find((p) => p.type === "REMAINING" && p.status === "COMPLETED");
    const remainingPaidText = remainingPayment ? toNumber(remainingPayment.amount).toFixed(2) : "";
    const fullyPaidText = order.status === "FULLY_PAID" ? toNumber(order.totalAmount).toFixed(2) : "";

    for (const traveller of order.travellers) {
      const extras = ((traveller.extras as { extras?: TravellerExtra[] } | null)?.extras ?? []).slice(0, 5);
      const extraCells = Array.from({ length: 5 }, (_, i) => {
        const e = extras[i];
        return e ? `${e.name} (${e.price.toFixed(2)} €)` : "";
      });

      const cabinUnitPrice = traveller.cabinTypeId
        ? (snapshot.cabinBreakdown ?? []).find((c) => c.cabinTypeId === traveller.cabinTypeId)?.unitPrice
        : undefined;
      const baseAmount = cabinUnitPrice ?? snapshot.baseUnitPrice ?? 0;
      const extrasAmount = extras.reduce((sum, e) => sum + e.price, 0);
      const travellerAmount = (baseAmount + extrasAmount).toFixed(2);

      rows.push(
        csvRow([
          order.orderNumber,
          traveller.firstName,
          traveller.lastName,
          traveller.birthDate.toISOString().slice(0, 10),
          order.userPhone ?? "",
          order.userEmail,
          order.city ?? "",
          order.pickupCity ?? "",
          traveller.seat?.seatNumber ?? "",
          travellerAmount,
          payingDeposit ? "Taip" : "Ne",
          order.userComment ?? "",
          depositAmountText,
          remainingPaidText,
          fullyPaidText,
          ...extraCells,
        ]),
      );
    }
  }

  // ﻿ — UTF-8 BOM, kad Excel (ne tik LibreOffice/Notepad) teisingai
  // atpažintų lietuviškas raides atidarant failą tiesiogiai, ne per
  // "Import" dialogą su rankiniu encoding'o pasirinkimu.
  return "﻿" + rows.join("\r\n") + "\r\n";
}
