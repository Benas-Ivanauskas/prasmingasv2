import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { discountInputSchema } from "../services/discount.schemas.js";
import {
  createAdminDiscount,
  deleteAdminDiscount,
  getAdminDiscountById,
  listAdminDiscounts,
  updateAdminDiscount,
} from "../services/discount.service.js";

function requireAdminId(req: Request): string {
  if (!req.admin) {
    throw new ApiError(401, "Neprisijungta");
  }
  return req.admin.id;
}

function parseBody(req: Request) {
  const parsed = discountInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }
  return parsed.data;
}

export async function listDiscounts(req: Request, res: Response) {
  const discounts = await listAdminDiscounts();
  res.json(discounts);
}

export async function getDiscount(req: Request, res: Response) {
  const discount = await getAdminDiscountById(req.params.id as string);
  res.json(discount);
}

export async function createDiscount(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const input = parseBody(req);
  const discount = await createAdminDiscount(input, adminId);
  res.status(201).json(discount);
}

export async function updateDiscount(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const input = parseBody(req);
  const discount = await updateAdminDiscount(req.params.id as string, input, adminId);
  res.json(discount);
}

export async function deleteDiscount(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const result = await deleteAdminDiscount(req.params.id as string, adminId);
  res.json(result);
}
