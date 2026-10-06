import { mockTrips } from "../../trip";
import type { Trip } from "../types/trip";

// Cached at module scope (not per-component) so repeated mounts of MainCard
// — e.g. navigating away and back — reuse the same fetch instead of
// re-requesting.
let cachedTrips: Promise<Trip[]> | null = null;

// Placeholder data source. Swap this function's body for a real
// `fetch("/api/trips").then(r => r.json())` once the backend exists —
// callers already treat this as async and cached, so nothing else needs
// to change.
export function fetchTrips(): Promise<Trip[]> {
  // Runs on every call (not just cache misses) so a hold that expired since
  // the last read is reflected immediately — a real TTL-backed store (e.g.
  // Redis EXPIRE) checks this lazily at read time too, not on a client clock.
  purgeExpiredHolds();

  if (!cachedTrips) {
    cachedTrips = Promise.resolve(mockTrips);
  }
  return cachedTrips;
}

// Used by TripPage for the /trips/:slug route. Swap this for a real
// `fetch(`/api/trips/${slug}`)` later — a dedicated detail endpoint avoids
// shipping the whole catalog just to load one trip.
export async function fetchTripBySlug(slug: string): Promise<Trip | undefined> {
  const trips = await fetchTrips();
  return trips.find((trip) => trip.slug === slug);
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
// Swap holdSeats/holdFlightSeats/confirmHold/releaseHold for real
// `POST .../hold`, `POST .../hold/:id/confirm`, `DELETE .../hold/:id` calls
// later — callers already treat these as the only place holds are
// created/resolved, so nothing else needs to change.
const HOLD_TTL_MS = 15 * 60 * 1000;

interface CapacityHold {
  tripId: string;
  departureId: string;
  seatIds: string[]; // BUS/CRUISE — empty for FLIGHT
  flightCount: number; // FLIGHT — 0 for BUS/CRUISE
  expiresAt: number;
}

let holdCounter = 0;
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

// Purges first (so a just-expired hold's seats read as FREE again before
// this one checks them), then registers the new hold.
function createHold(
  tripId: string,
  departureId: string,
  seatIds: string[],
  flightCount: number
): HoldResult {
  purgeExpiredHolds();
  const holdId = `hold-${++holdCounter}`;
  const expiresAt = Date.now() + HOLD_TTL_MS;
  activeHolds.set(holdId, { tripId, departureId, seatIds, flightCount, expiresAt });
  return { holdId, expiresAt };
}

// Mutates the shared mock data in place, marking the given seats HELD (only
// if currently FREE), and starts their TTL countdown.
export function holdSeats(tripId: string, departureId: string, seatIds: string[]): HoldResult {
  const result = createHold(tripId, departureId, seatIds, 0);

  const trip = mockTrips.find((t) => t.id === tripId);
  const departure = trip?.departures.find((d) => d.id === departureId);
  for (const seat of departure?.seats ?? []) {
    if (seat.status === "FREE" && seatIds.includes(seat.id)) {
      seat.status = "HELD";
    }
  }

  return result;
}

// FLIGHT's equivalent of holdSeats — reserves a passenger count instead of
// specific seats (there are none), on the same TTL.
export function holdFlightSeats(
  tripId: string,
  departureId: string,
  count: number
): HoldResult {
  return createHold(tripId, departureId, [], count);
}

// Called once payment is confirmed — turns the hold permanent instead of
// leaving it to expire: seats become TAKEN, a FLIGHT count gets added to
// flightSeatsTaken.
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

// Called if the user explicitly backs out — releases the hold right away
// instead of making it wait out the TTL.
export function releaseHold(holdId: string): void {
  const hold = activeHolds.get(holdId);
  if (!hold) return;
  releaseHoldCapacity(hold);
  activeHolds.delete(holdId);
}
