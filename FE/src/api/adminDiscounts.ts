import { mockDiscountCodes, mockVouchers } from "../../discounts";
import type { DiscountCode, GiftVoucher } from "../types/discount";

// Admin-side CRUD for discount codes/vouchers. Placeholder data source: it
// mutates the same in-memory arrays api/trips.ts reads for the public
// checkout lookup, so changes show up there immediately but are lost on a
// page reload. Swap each function's body for real API calls once the
// backend exists — callers already treat these as async.

export async function adminListDiscountCodes(): Promise<DiscountCode[]> {
  return mockDiscountCodes;
}

// Returns an error message when the code can't be saved, otherwise null.
export async function adminSaveDiscountCode(discount: DiscountCode): Promise<string | null> {
  const codeTaken = mockDiscountCodes.some(
    (d) => d.code === discount.code && d.id !== discount.id
  );
  if (codeTaken) return "Nuolaidos kodas su tokiu pavadinimu jau egzistuoja.";

  const index = mockDiscountCodes.findIndex((d) => d.id === discount.id);
  if (index >= 0) mockDiscountCodes[index] = discount;
  else mockDiscountCodes.push(discount);
  return null;
}

export async function adminDeleteDiscountCode(id: string): Promise<void> {
  const index = mockDiscountCodes.findIndex((d) => d.id === id);
  if (index >= 0) mockDiscountCodes.splice(index, 1);
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

export async function adminListVouchers(): Promise<GiftVoucher[]> {
  return mockVouchers;
}

export async function adminSaveVoucher(voucher: GiftVoucher): Promise<string | null> {
  const codeTaken = mockVouchers.some((v) => v.code === voucher.code && v.id !== voucher.id);
  if (codeTaken) return "Kuponas su tokiu kodu jau egzistuoja.";

  const index = mockVouchers.findIndex((v) => v.id === voucher.id);
  if (index >= 0) mockVouchers[index] = voucher;
  else mockVouchers.push(voucher);
  return null;
}

export async function adminDeleteVoucher(id: string): Promise<void> {
  const index = mockVouchers.findIndex((v) => v.id === id);
  if (index >= 0) mockVouchers.splice(index, 1);
}

export function createEmptyVoucher(): GiftVoucher {
  return {
    id: `voucher-${Date.now()}`,
    code: "",
    value: 0,
    isActive: true,
  };
}
