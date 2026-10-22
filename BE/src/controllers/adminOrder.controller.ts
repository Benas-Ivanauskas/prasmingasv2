import type { Request, Response } from "express";
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
