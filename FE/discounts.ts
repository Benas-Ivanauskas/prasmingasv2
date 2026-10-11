import type { DiscountCode, GiftVoucher } from "./src/types/discount";

// Mock-only data source — no backend yet. Mutated in place by
// src/api/adminDiscounts.ts (admin CRUD) and read by src/api/trips.ts
// (public checkout lookup), same relationship trip.ts's mockTrips has with
// api/adminTrips.ts and api/trips.ts.
export const mockDiscountCodes: DiscountCode[] = [
  { id: "discount-1", code: "SAULE10", type: "PERCENTAGE", value: 10, isActive: true },
  { id: "discount-2", code: "KELIONE5", type: "PERCENTAGE", value: 5, isActive: true },
  { id: "discount-3", code: "KODAS20", type: "FIXED", value: 20, isActive: true },
];

export const mockVouchers: GiftVoucher[] = [
  { id: "voucher-1", code: "DOVANA100", value: 100, isActive: true },
  { id: "voucher-2", code: "DOVANA50", value: 50, isActive: true },
];
