import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Not found: ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;

  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  // Nenumatytoms (5xx) klaidoms klientui NIEKADA nesiunčiamas err.message —
  // tai gali būti Prisma/TypeError tekstas su vidiniais detaliais (stulpelio
  // pavadinimu, failo keliu ir pan.). 4xx (ApiError) pranešimai yra sąmoningai
  // suformuoti vartotojui, tad siunčiami kaip yra.
  const message =
    status >= 500 ? "Įvyko serverio klaida. Bandykite vėliau." : err instanceof Error ? err.message : "Bad request";

  res.status(status).json({ error: { message } });
}
