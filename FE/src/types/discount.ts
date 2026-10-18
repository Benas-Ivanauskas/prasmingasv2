export type DiscountType = "PERCENTAGE" | "FIXED";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  // ISO date string (YYYY-MM-DD) — the code stops working the day AFTER
  // this date, same inclusive-deadline-day convention as Departure's own
  // depositDeadline. Unset/null = never expires.
  expiresAt?: string | null;
}

export interface GiftVoucher {
  id: string;
  code: string;
  value: number;
  isActive: boolean;
}
