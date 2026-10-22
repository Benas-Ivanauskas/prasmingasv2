export type DiscountType = "PERCENTAGE" | "FIXED";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  // ISO date string (YYYY-MM-DD) — the code stops working the day AFTER
  // this date, same inclusive-deadline-day convention as Departure's own
  // depositDeadline. Null only while `isActive` is false — AdminDiscounts.tsx
  // blocks saving `isActive: true` with no expiresAt (every active code must
  // have an expiry; admin decision, not a Prisma/DB-level constraint).
  expiresAt?: string | null;
}

// Vieša /api/discounts/validate atsakymo forma — sąmoningai siaura (be
// id/code/isActive/expiresAt), kad nebūtų galima išvardinti/atpažinti kodų
// per atsakymo turinį.
export interface DiscountValidation {
  type: DiscountType;
  value: number;
}
