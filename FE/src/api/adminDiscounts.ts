import type { DiscountCode } from "../types/discount";

// Realus BE kvietimas (ne mock duomenys) — Fazė 3 admin pusė. Sesija
// laikoma httpOnly cookie, tad visur `credentials: "include"`.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? "Įvyko klaida";
  } catch {
    return "Įvyko klaida";
  }
}

export async function adminListDiscountCodes(): Promise<DiscountCode[]> {
  const res = await fetch(`${API_URL}/api/admin/discounts`, { credentials: "include" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// Returns an error message when the code can't be saved, otherwise null.
// `isNew` renka POST (sukurti) vs PUT /:id (redaguoti) — tas pats pattern'as
// kaip adminTrips.ts'o adminSaveTrip (id visada užpildytas, net naujam
// kodui, tad vien iš jo buvimo negalima patikimai spręsti create/update).
export async function adminSaveDiscountCode(discount: DiscountCode, isNew = false): Promise<string | null> {
  const url = isNew ? `${API_URL}/api/admin/discounts` : `${API_URL}/api/admin/discounts/${discount.id}`;
  const res = await fetch(url, {
    method: isNew ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(discount),
  });
  if (!res.ok) return parseErrorMessage(res);
  return null;
}

export async function adminDeleteDiscountCode(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/discounts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export function createEmptyDiscountCode(): DiscountCode {
  return {
    id: `discount-${Date.now()}`,
    code: "",
    type: "PERCENTAGE",
    value: 0,
    isActive: true,
    expiresAt: null,
  };
}
