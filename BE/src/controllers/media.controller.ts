import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, "Nėra įkelto failo");
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
}
