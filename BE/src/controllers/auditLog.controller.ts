import type { Request, Response } from "express";
import { listAuditLog } from "../services/auditLog.service.js";

export async function getAuditLog(req: Request, res: Response) {
  const entries = await listAuditLog();
  res.json(entries);
}
