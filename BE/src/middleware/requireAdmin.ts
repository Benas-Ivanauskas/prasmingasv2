import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../services/auth.service.js";
import { ApiError } from "./errorHandler.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "Neprisijungta");
  }

  try {
    const payload = verifyAuthToken(token);
    req.admin = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, "Sesija negalioja arba baigėsi");
  }
}

export function requireRole(role: AdminRole) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.admin) {
      throw new ApiError(401, "Neprisijungta");
    }
    if (req.admin.role !== role) {
      throw new ApiError(403, "Neturite teisių šiam veiksmui");
    }
    next();
  };
}
