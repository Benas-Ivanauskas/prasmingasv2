// Realus BE kvietimas — ne mock duomenys (auth negali būti apsimestinis).
// Sesija laikoma httpOnly cookie (BE/src/controllers/auth.controller.ts),
// todėl kiekvienas fetch turi `credentials: "include"`.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface AdminUser {
  id?: string;
  email: string;
  role: "ADMIN" | "MANAGER";
}

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? "Įvyko klaida";
  } catch {
    return "Įvyko klaida";
  }
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new AuthError(res.status, await parseErrorMessage(res));
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new AuthError(res.status, await parseErrorMessage(res));
  }

  return res.json();
}
