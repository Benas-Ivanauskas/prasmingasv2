export interface TravellerForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  personalCode: string; // optional
  passportNumber: string; // FLIGHT only, required there
  passportExpiry: string; // FLIGHT only, required there
}

export interface ContactForm {
  email: string;
  phone: string;
  city: string;
  pickupCity: string; // BUS/CRUISE only — which of the departure's pickupPoints
  wantsInvoice: boolean; // mirrors schema.prisma's Order.wantsInvoice
}

// What Step 2 (Vietos) hands off to Step 3 (Keleiviai) via router state — the
// concrete seats/cabins picked, so later steps can show "which seat" per
// traveller and (for CRUISE) price by actual cabin type instead of the flat
// per-person departure cost.
export interface SeatSelectionState {
  seatNumbers: string[]; // ordered seat labels — BUS, or CRUISE's transfer bus
  cabinSelections?: Record<string, number>; // CRUISE only: cabinTypeId -> quantity
  // Set when seats were actually held (api/trips.ts's holdSeats) — absent
  // for FLIGHT, which has no individual seats to hold. The reservation
  // session's TTL runs from here, not from whenever the payment page is
  // later opened.
  holdId?: string;
  holdExpiresAt?: number;
  // The two fields below only travel BACKWARD (Step 3 → Step 2, via its
  // "← Atgal" link) — the actual seat ids (not just their display labels)
  // and the FLIGHT traveller count, so Step 2 can restore exactly what was
  // selected instead of resetting to a blank seat map.
  selectedSeatIds?: string[];
  travellerCount?: number;
}

// Legal-document acknowledgements collected once per order (not per
// traveller). BUS/CRUISE collect the first three; FLIGHT additionally
// collects agreedAirCarriage (air carriage conditions).
export interface ConsentForm {
  agreedInfoForm: boolean;
  agreedPrivacyPolicy: boolean;
  agreedTravellerMemo: boolean;
  agreedAirCarriage?: boolean;
}

// Step 4's own fields — only ever set when round-tripping Step 4 → Step 3 →
// Step 4 again via the "← Atgal" links, so a trip back to fix a traveller's
// details doesn't wipe out a comment or an already-applied discount code.
export interface PaymentExtras {
  comment: string;
  agreed: boolean;
  discountCode?: string;
  voucherCode?: string;
}

// What Step 3 (Keleiviai) hands off to Step 4 (Mokėjimas) via router state —
// everything a user typed in or picked, nothing else derived (pricing/extras
// get recomputed from the trip/departure on the payment page itself, same as
// every other step).
export interface BookingState extends SeatSelectionState {
  contact: ContactForm;
  travellers: (TravellerForm & { extraIds: string[] })[];
  consents: ConsentForm;
  paymentExtras?: PaymentExtras;
}
