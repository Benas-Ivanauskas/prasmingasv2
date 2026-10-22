import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { holdInputSchema } from "../services/hold.schemas.js";
import { createHold as createHoldService, releaseHold } from "../services/hold.service.js";

export async function createHold(req: Request, res: Response) {
  const departureId = req.params.id;
  if (typeof departureId !== "string") {
    throw new ApiError(400, "Neteisingas išvykimo adresas");
  }

  const parsed = holdInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }

  const result = await createHoldService(departureId, parsed.data);
  res.status(201).json(result);
}

export async function deleteHold(req: Request, res: Response) {
  const holdId = req.params.holdId;
  if (typeof holdId !== "string") {
    throw new ApiError(400, "Neteisingas hold id");
  }

  await releaseHold(holdId);
  res.status(204).send();
}
