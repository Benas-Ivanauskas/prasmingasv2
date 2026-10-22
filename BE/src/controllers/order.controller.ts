import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { checkoutInputSchema } from "../services/order.schemas.js";
import { checkout, cancelPendingOrder, getOrderById } from "../services/order.service.js";

export async function checkoutController(req: Request, res: Response) {
  const parsed = checkoutInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }

  const result = await checkout(parsed.data);
  res.status(201).json(result);
}

export async function getOrderController(req: Request, res: Response) {
  const orderId = req.params.id;
  if (typeof orderId !== "string") {
    throw new ApiError(400, "Neteisingas užsakymo adresas");
  }

  const result = await getOrderById(orderId);
  res.json(result);
}

export async function cancelPendingController(req: Request, res: Response) {
  const orderId = req.params.id;
  if (typeof orderId !== "string") {
    throw new ApiError(400, "Neteisingas užsakymo adresas");
  }

  const result = await cancelPendingOrder(orderId);
  res.status(200).json(result);
}
