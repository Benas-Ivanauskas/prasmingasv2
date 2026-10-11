export type DiscountType = "PERCENTAGE" | "FIXED";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
}

export interface GiftVoucher {
  id: string;
  code: string;
  value: number;
  isActive: boolean;
}
