import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  signAuthToken,
  verifyCredentials,
} from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Neteisingas el. paštas arba slaptažodis");
  }

  const admin = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!admin) {
    throw new ApiError(401, "Neteisingas el. paštas arba slaptažodis");
  }

  const token = signAuthToken(admin);
  setAuthCookie(res, token);

  res.json({ email: admin.email, role: admin.role });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  // requireAdmin middleware jau patikrino ir nustatė req.admin prieš pasiekiant šį handler'į
  res.json(req.admin);
}
