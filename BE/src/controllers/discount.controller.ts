import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { validateCodeBodySchema } from "../services/discount.schemas.js";
import { validateDiscountCode } from "../services/discount.service.js";

export async function validateDiscount(req: Request, res: Response) {
  const parsed = validateCodeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Įveskite nuolaidos kodą");
  }

  const result = await validateDiscountCode(parsed.data.code);
  res.json(result);
}
