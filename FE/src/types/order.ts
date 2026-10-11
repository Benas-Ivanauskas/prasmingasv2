export type OrderPaymentStatus = "DEPOSIT_PAID" | "FULLY_PAID";
export type OrderStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  tripId: string;
  departureId: string;
  // Denormalized so a table row can render without a separate trip lookup.
  tripTitle: string;
  clientName: string;
  phone: string;
  email: string;
  note?: string;
  travellerCount: number;
  // BUS/CRUISE — lets "Atšaukti" release the right seats back to FREE.
  seatIds?: string[];
  // FLIGHT — subtracted from departure.flightSeatsTaken on cancel.
  flightCount?: number;
  totalAmount: number;
  // Set only when paymentStatus is DEPOSIT_PAID.
  depositAmount?: number;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  createdAt: string;
  // true for orders made via admin's "+ Naujas užsakymas (ranka)".
  createdByAdmin: boolean;
}
