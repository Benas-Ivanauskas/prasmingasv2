import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/errorHandler.js";
import { adminManualOrderInputSchema, adminPaymentStatusInputSchema } from "../services/adminOrder.schemas.js";
import {
  listAdminOrders,
  getAdminOrderById,
  createAdminManualOrder,
  updateAdminOrderPaymentStatus,
  cancelAdminOrder,
  sendRemainingPaymentLink,
} from "../services/adminOrder.service.js";
import { generateInvoicePdf, generateVatInvoicePdf, type InvoicePaymentType } from "../services/invoice.service.js";
import { generateContractPdf } from "../services/contract.service.js";

function sendPdf(res: Response, pdf: Buffer, filename: string) {
  res.status(200).set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filename}"` }).send(pdf);
}

const invoiceQuerySchema = z.object({ paymentType: z.enum(["FULL", "DEPOSIT", "REMAINING"]) });

function requireAdminId(req: Request): string {
  if (!req.admin) {
    throw new ApiError(401, "Neprisijungta");
  }
  return req.admin.id;
}

export async function listOrders(req: Request, res: Response) {
  const orders = await listAdminOrders();
  res.json(orders);
}

export async function getOrder(req: Request, res: Response) {
  const order = await getAdminOrderById(req.params.id as string);
  res.json(order);
}

export async function createManualOrder(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const parsed = adminManualOrderInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }

  const result = await createAdminManualOrder(parsed.data, adminId);
  res.status(201).json(result);
}

export async function updatePaymentStatus(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const parsed = adminPaymentStatusInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }

  const result = await updateAdminOrderPaymentStatus(req.params.id as string, parsed.data, adminId);
  res.json(result);
}

export async function cancelOrder(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const result = await cancelAdminOrder(req.params.id as string, adminId);
  res.json(result);
}

export async function payRemaining(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const result = await sendRemainingPaymentLink(req.params.id as string, adminId);
  res.json(result);
}

export async function downloadInvoice(req: Request, res: Response) {
  const orderId = req.params.id as string;
  const parsed = invoiceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Neteisingas paymentType — turi būti FULL, DEPOSIT arba REMAINING");
  }
  const paymentType: InvoicePaymentType = parsed.data.paymentType;

  const order = await getAdminOrderById(orderId);
  if (!order.completedPaymentTypes.includes(paymentType)) {
    throw new ApiError(400, `Šiam užsakymui nėra apmokėto ${paymentType} tipo mokėjimo — sąskaitos generuoti negalima`);
  }

  const pdf = await generateInvoicePdf(orderId, paymentType);
  sendPdf(res, pdf, "isankstine-saskaita.pdf");
}

export async function downloadContract(req: Request, res: Response) {
  const orderId = req.params.id as string;
  const order = await getAdminOrderById(orderId);
  if (order.completedPaymentTypes.length === 0) {
    throw new ApiError(400, "Šiam užsakymui dar nėra jokio apmokėjimo — sutarties generuoti negalima");
  }

  const pdf = await generateContractPdf(orderId);
  sendPdf(res, pdf, "keliones-sutartis.pdf");
}

export async function downloadVatInvoice(req: Request, res: Response) {
  const orderId = req.params.id as string;
  const order = await getAdminOrderById(orderId);
  if (order.status !== "DEPOSIT_PAID" && order.status !== "FULLY_PAID") {
    throw new ApiError(400, "Šis užsakymas dar neapmokėtas — PVM sąskaitos faktūros generuoti negalima");
  }

  const pdf = await generateVatInvoicePdf(orderId);
  sendPdf(res, pdf, "pvm-saskaita-faktura.pdf");
}
