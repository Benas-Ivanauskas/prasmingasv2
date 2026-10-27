import { readFileSync } from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { convertDocxToPdf } from "../lib/docxToPdf.js";
import { getCabinTypeLabel, type CabinTypeName } from "../lib/cabinLabels.js";
import { getOrderDocumentData } from "./orderDocumentData.service.js";

interface CabinBreakdownEntry {
  type: CabinTypeName;
  qty: number;
}

interface PriceSnapshot {
  cabinBreakdown: CabinBreakdownEntry[] | null;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getTripTransportLabel(tripType: "BUS" | "FLIGHT" | "CRUISE"): string {
  switch (tripType) {
    case "FLIGHT":
      return "Lėktuvas";
    case "CRUISE":
      return "Autobusas + Kruizinis laivas";
    case "BUS":
    default:
      return "Autobusas";
  }
}

export async function generateContractPdf(orderId: string): Promise<Buffer> {
  const order = await getOrderDocumentData(orderId);
  const snapshot = order.priceSnapshot as unknown as PriceSnapshot;
  const tripType = order.departure.trip.tripType;
  const travellers = order.travellers;
  const mainTraveller = travellers[0];

  const cabinReservationText =
    tripType === "CRUISE" && snapshot.cabinBreakdown
      ? snapshot.cabinBreakdown.map((c) => `${c.qty} x ${getCabinTypeLabel(c.type)}`).join(", ")
      : "";

  // durationDays skaičiuoja KALENDORINES dienas imtinai (pvz. išvykimas 31
  // d., trukmė 2 d. => grįžimas 01 d.), tad grįžimo data = išvykimas +
  // (durationDays - 1), ne + durationDays.
  const tripReturnDate = new Date(order.departure.date);
  tripReturnDate.setDate(tripReturnDate.getDate() + order.departure.durationDays - 1);

  // Ta pati logika kaip invoice.service.ts::buildInvoiceData — kai klientas
  // perka kaip įmonė, sutartis irgi rodo ĮMONĘ kaip pirkėją, ne keleivį.
  const isCompany = Boolean(order.companyName?.trim());

  const data = {
    date: formatDate(new Date()),
    orderNumber: order.orderNumber,
    mainNumber: order.userPhone ?? "",
    mainEmail: order.userEmail,
    mainAddress: isCompany ? (order.companyDetails?.trim() ?? "") : (order.city ?? ""),
    mainTravellersName: isCompany
      ? order.companyName!.trim()
      : mainTraveller
        ? `${mainTraveller.firstName} ${mainTraveller.lastName}`
        : "",
    users: travellers.map((t) => ({
      name: `${t.firstName} ${t.lastName}`,
      birthdate: formatDate(t.birthDate),
      phoneNumber: order.userPhone ?? "",
      pickupPlace: order.pickupCity ?? "",
      occupiedSeat: t.seat?.seatNumber ?? "",
    })),
    userComment: order.userComment ?? "",
    cabinReservationText,
    tripName: order.departure.trip.title,
    tripDate: formatDate(order.departure.date),
    tripReturn: formatDate(tripReturnDate),
    tripDuration: String(order.departure.durationDays),
    numberOfCust: String(travellers.length),
    tripTransport: getTripTransportLabel(tripType),
  };

  const templatePath = path.join(process.cwd(), "assets/documents/static", "kel_sutartis_temp.docx");
  const content = readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const docxBuffer: Buffer = doc.getZip().generate({ type: "nodebuffer" });

  return convertDocxToPdf(docxBuffer);
}
