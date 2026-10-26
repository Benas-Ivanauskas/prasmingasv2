// Atitinka TIKSLIAI BE/schema.prisma's Order.status enum'ą — anksčiau FE
// turėjo DU atskirus mock-laikų laukus (paymentStatus + status), kurie
// nesutapo su realia, VIENA sujungta schema; sujungta į vieną realų lauką
// (Fazė 7-A), kai /admin/orders tapo realus.
export type OrderStatus = "PENDING_PAYMENT" | "DEPOSIT_PAID" | "FULLY_PAID" | "CANCELLED" | "EXPIRED";
// Siauresnis poaibis — KĄ admin gali rinktis KURDAMAS užsakymą ranka
// (niekada CANCELLED/EXPIRED tiesiogiai kūrimo metu).
export type OrderPaymentStatus = "PENDING_PAYMENT" | "DEPOSIT_PAID" | "FULLY_PAID";

// Per-traveller personal info — same shape the public booking flow's Step 3
// ("Keleiviai") collects per person. Lives here (not buySessionTypes.ts,
// which re-exports it) so Order itself can require it below: a
// multi-traveller order needs every traveller's own data, not just one
// contact name (see TravellerFields.tsx, shared by BuyTravellerInfo.tsx and
// AdminOrderNew.tsx).
export interface TravellerForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  personalCode: string; // optional
  passportNumber: string; // FLIGHT only, required there
  passportExpiry: string; // FLIGHT only, required there
}

export interface Order {
  id: string;
  orderNumber: string;
  tripId: string;
  departureId: string;
  // Denormalized so a table row can render without a separate trip lookup.
  tripTitle: string;
  // Buyer/contact — may or may not be one of the travellers themselves.
  clientName: string;
  phone: string;
  email: string;
  note?: string;
  travellerCount: number;
  // One entry per travellerCount — each traveller's own data, not just the
  // buyer's name (see TravellerForm above).
  travellers: TravellerForm[];
  // BUS/CRUISE — lets "Atšaukti" release the right seats back to FREE.
  seatIds?: string[];
  // FLIGHT — subtracted from departure.flightSeatsTaken on cancel.
  flightCount?: number;
  totalAmount: number;
  // Set only when status is DEPOSIT_PAID.
  depositAmount?: number;
  status: OrderStatus;
  createdAt: string;
  // true for orders made via admin's "+ Naujas užsakymas (ranka)".
  createdByAdmin: boolean;
  // Paskutinio REMAINING tipo Payment būsena — null, jei likusio mokėjimo
  // nuoroda dar nė karto nesiųsta šiam užsakymui (Fazė 7-B).
  remainingPaymentStatus?: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | null;
  // Klientas pažymėjo Step 1 "Su PVM sąskaita faktūra" — admin'as taip pat
  // gali sugeneruoti/atsisiųsti ją rankiniu būdu bet kuriuo metu (žr.
  // AdminOrders.tsx), nepriklausomai nuo automatinio post-trip cron'o.
  wantsInvoice: boolean;
  // Kurie išankstinės sąskaitos variantai realiai apmokėti ir atsisiunčiami
  // — tiksliai atspindi Payment įrašus, ne vien spėjama iš `status` (žr.
  // BE adminOrder.service.ts::serializeAdminOrder komentarą).
  completedPaymentTypes: ("FULL" | "DEPOSIT" | "REMAINING")[];
}
