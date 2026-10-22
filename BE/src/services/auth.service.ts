import type { Admin } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const TOKEN_EXPIRES_IN = "1d";
export const AUTH_COOKIE_NAME = "prasmingas_session";
export const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1d, TOKEN_EXPIRES_IN

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: Admin["role"];
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<Admin | null> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  return passwordMatches ? admin : null;
}

export function signAuthToken(admin: Admin): string {
  const payload: AuthTokenPayload = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
