import { mockTrips } from "../../trip";
import type { Trip } from "../types/trip";
import type { DiscountValidation } from "../types/discount";
import type { Order } from "../types/order";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Cached at module scope (not per-component) so repeated mounts of MainCard
// — e.g. navigating away and back — reuse the same fetch instead of
// re-requesting.
let cachedTrips: Promise<Trip[]> | null = null;

// Realus BE kvietimas (ne mock duomenys) — Fazė 2.
export function fetchTrips(): Promise<Trip[]> {
  // Runs on every call (not just cache misses) so a hold that expired since
  // the last read is reflected immediately — a real TTL-backed store (e.g.
  // Redis EXPIRE) checks this lazily at read time too, not on a client clock.
  purgeExpiredHolds();

  if (!cachedTrips) {
    cachedTrips = fetch(`${API_URL}/api/trips`).then((res) => {
      if (!res.ok) throw new Error("Nepavyko gauti kelionių sąrašo");
      return res.json();
    });
  }
  return cachedTrips;
}

// Dedikuotas detalės endpoint'as — nesiunčia viso katalogo vienai kelionei
// parodyti.
export async function fetchTripBySlug(slug: string): Promise<Trip | undefined> {
  const res = await fetch(`${API_URL}/api/trips/${slug}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error("Nepavyko gauti kelionės");
  return res.json();
}

// Checkout's Step 1 "Nuolaidos kodas" lookup — realus BE kvietimas.
// Atsakymas sąmoningai siauras (be code/id/isActive) — žr. types/discount.ts
// DiscountValidation komentarą.
export async function lookupDiscountCode(code: string): Promise<DiscountValidation | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  const res = await fetch(`${API_URL}/api/discounts/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalized }),
  });
  if (!res.ok) return undefined;
  return res.json();
}

// ─────────────────────────────────────────────────────────
// CHECKOUT (Fazė 5) — realus BE kvietimas.
// ─────────────────────────────────────────────────────────
export interface CheckoutTraveller {
  firstName: string;
  lastName: string;
  birthDate: string;
  personalCode?: string;
  passportNumber?: string; // FLIGHT privalomas
  passportExpiry?: string; // FLIGHT privalomas
  extraIds: string[];
}

export interface CheckoutRequestBody {
  departureId: string;
  holdId: string;
  travellers: CheckoutTraveller[];
  seatIds?: string[];
  cabinSelections?: Record<string, number>;
  flightCount?: number;
  contact: { email: string; phone: string };
  pickupCity?: string;
  pickupTime?: string;
  wantsInvoice: boolean;
  wantsDeposit: boolean;
  discountCode?: string;
  userComment?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  redirectUrl: string;
}

export async function checkoutOrder(body: CheckoutRequestBody): Promise<CheckoutResponse> {
  const res = await fetch(`${API_URL}/api/orders/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Nepavyko sukurti užsakymo");
  }
  return res.json();
}

// Kviečiama cancelurl puslapio (BuyCancelled.tsx) prisijungimo metu — fire
// ir pamiršk, klaida čia nekritinė (jei nepavyks, PENDING_PAYMENT užsakymas
// vis tiek savaime taps EXPIRED per Fazės 8 cron'ą).
export async function cancelPendingOrder(orderId: string): Promise<void> {
  await fetch(`${API_URL}/api/orders/${orderId}/cancel-pending`, { method: "POST" });
}

export interface OrderStatusResponse {
  orderNumber: string;
  status: string; // OrderStatus — PENDING_PAYMENT/DEPOSIT_PAID/FULLY_PAID/CANCELLED/EXPIRED
  email: string;
  travellerCount: number;
  seatNumbers: string[];
  pickupCity: string | null;
  depositAmount: number | null;
  remainingAmount: number | null;
  remainingDueDate: string | null;
}

// Naudojama BuySuccess.tsx'o — orderId ateina iš URL query param'o (realus
// Paysera accepturl redirect, ne router state, kuris dingsta per tikrą
// naršyklės navigaciją).
export async function fetchOrderById(orderId: string): Promise<OrderStatusResponse | undefined> {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error("Nepavyko gauti užsakymo");
  return res.json();
}

// No backend yet to actually render one — BE will need to generate the PVM
// invoice PDF and serve it from a real file/URL. A deposit-paid order needs
// two documents (deposit invoice + final-payment invoice), a fully paid one
// needs a single combined invoice. Swap this for a real
// `GET /api/orders/:id/invoice.pdf` later; the caller already awaits it.
export async function downloadOrderInvoicePdf(order: Order): Promise<void> {
  if (order.status === "DEPOSIT_PAID") {
    console.log(
      "TODO(BE): generate and download BOTH deposit and final-payment invoice PDFs for order",
      order.orderNumber
    );
  } else {
    console.log("TODO(BE): generate and download the full-payment invoice PDF for order", order.orderNumber);
  }
}

// No backend yet to actually render one — BE will need to generate the PDF
// (trip title/program/dates etc.) and serve it from a real file/URL. Swap
// this for a real `GET /api/trips/:id/program.pdf` (or a signed URL from
// a POST that kicks off generation) later; the caller already awaits it.
export async function downloadTripProgramPdf(tripId: string): Promise<void> {
  console.log("TODO(BE): generate and download trip program PDF for", tripId);
}

// The three legal documents linked from Step 3's consent checkboxes
// (standard info form, privacy policy, traveller memo) — static files for
// now, BE will need to host and version them. Swap this for a real
// `GET /api/documents/:key.pdf` later.
export async function downloadConsentDocument(documentKey: string): Promise<void> {
  console.log("TODO(BE): serve consent document PDF for", documentKey);
}

// ─────────────────────────────────────────────────────────
// CAPACITY HOLDS
// ─────────────────────────────────────────────────────────
// Covers all three trip types, not just BUS/CRUISE's individual seats —
// FLIGHT has no per-seat data, only an aggregate flightSeatsTaken count, so
// a FLIGHT hold reserves a *count* instead of specific seat ids, but goes
// through the exact same TTL/confirm/release lifecycle as a seat hold.
//
// The reservation session starts the moment seats (or, for FLIGHT, a
// traveller count) are picked in Step 2, not when the payment page happens
// to be opened — it runs on a fixed TTL and, if payment isn't confirmed
// before it expires, the hold falls back on its own (checked lazily via
// purgeExpiredHolds(), same as a real TTL-backed store would do — no
// background timer needed on the client).
//
// holdSeats/holdFlightSeats/releaseHold are now real BE calls (Fazė 4) —
// confirmHold stays mock below (Fazė 5 territory, see its own comment).
// activeHolds is never populated anymore, so confirmHold is now permanently
// a no-op — kept only until Fazė 5 wires a real equivalent (see its comment).
interface CapacityHold {
  tripId: string;
  departureId: string;
  seatIds: string[]; // BUS/CRUISE — empty for FLIGHT
  flightCount: number; // FLIGHT — 0 for BUS/CRUISE
  expiresAt: number;
}

const activeHolds = new Map<string, CapacityHold>();

// FLIGHT holds don't touch flightSeatsTaken until confirmed, so releasing
// one (explicitly or via TTL expiry) needs no action beyond forgetting it —
// only seat-based holds have something to actually put back.
function releaseHoldCapacity(hold: CapacityHold): void {
  if (hold.seatIds.length === 0) return;

  const trip = mockTrips.find((t) => t.id === hold.tripId);
  for (const seat of trip?.departures.find((d) => d.id === hold.departureId)?.seats ?? []) {
    if (seat.status === "HELD" && hold.seatIds.includes(seat.id)) {
      seat.status = "FREE";
    }
  }
}

function purgeExpiredHolds(): void {
  const now = Date.now();
  for (const [id, hold] of activeHolds) {
    if (hold.expiresAt > now) continue;
    releaseHoldCapacity(hold);
    activeHolds.delete(id);
  }
}

export interface HoldResult {
  holdId: string;
  expiresAt: number;
}

// Real BE calls (Fazė 4) — departureId alone identifies the departure via
// its Postgres FK, no tripId needed. Can reject with 409 if someone else
// grabbed the same seat(s)/cabin(s)/the last ticket between page load and click.
async function postHold(
  departureId: string,
  body: { seatIds: string[]; cabinSelections?: Record<string, number> } | { flightCount: number }
): Promise<HoldResult> {
  const res = await fetch(`${API_URL}/api/departures/${departureId}/hold`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Nepavyko rezervuoti pasirinkimo");
  }
  return res.json();
}

// cabinSelections (CRUISE only) is held TOGETHER with seatIds, in the same
// atomic hold/holdId — released as one unit too, see releaseHold.
export function holdSeats(
  departureId: string,
  seatIds: string[],
  cabinSelections?: Record<string, number>
): Promise<HoldResult> {
  return postHold(departureId, cabinSelections && Object.keys(cabinSelections).length > 0 ? { seatIds, cabinSelections } : { seatIds });
}

// FLIGHT's equivalent of holdSeats — reserves a passenger count instead of
// specific seats (there are none), on the same TTL.
export function holdFlightSeats(departureId: string, count: number): Promise<HoldResult> {
  return postHold(departureId, { flightCount: count });
}

// SĄMONINGAI PALIEKAMA MOCK (Fazė 4 scope boundary) — realus atitikmuo
// (Seat.status='TAKEN'/flightSeatsTaken++) priklauso Fazės 5 checkout
// transakcijai, kurios dar nėra. activeHolds nebepildomas (holdSeats/
// holdFlightSeats dabar realūs BE kvietimai), tad šis žemiau visada ras
// tuščia ir tyliai nieko nedarys — jau ir taip nebeveikianti būsena
// (mockTrips viešas /trips/:slug nebeskaito nuo Fazė 2), tik formalizuota.
// PRIVALOMA grįžti čia Fazėje 5 — žr. BACKEND_IMPLEMENTATION_PLAN.md.
export function confirmHold(holdId: string): void {
  const hold = activeHolds.get(holdId);
  if (!hold) return;

  const trip = mockTrips.find((t) => t.id === hold.tripId);
  const departure = trip?.departures.find((d) => d.id === hold.departureId);
  if (departure) {
    for (const seat of departure.seats ?? []) {
      if (seat.status === "HELD" && hold.seatIds.includes(seat.id)) {
        seat.status = "TAKEN";
      }
    }
    if (hold.flightCount > 0) {
      departure.flightSeatsTaken = (departure.flightSeatsTaken ?? 0) + hold.flightCount;
    }
  }
  activeHolds.delete(holdId);
}

// Real BE call (Fazė 4) — fire-and-forget from callers that back out early.
export async function releaseHold(holdId: string): Promise<void> {
  await fetch(`${API_URL}/api/holds/${holdId}`, { method: "DELETE" });
}
