import { mockTrips } from "../../trip";
import type { Departure, Seat, Trip } from "../types/trip";
import { generateBusSeatLabels } from "../components/BuySession/busSeatLayout";

// Admin-side trip CRUD. Placeholder data source: it mutates the same
// in-memory `mockTrips` array that api/trips.ts serves, so changes show up
// on the public site immediately but are lost on a page reload. Swap each
// function's body for real `POST/PUT/DELETE /api/admin/trips` calls once the
// backend exists (and protect them with the admin session) — callers already
// treat these as async.

export const BUS_SIZES = [48, 49, 52, 53] as const;

export async function adminListTrips(): Promise<Trip[]> {
  return mockTrips;
}

export async function adminGetTrip(id: string): Promise<Trip | undefined> {
  return mockTrips.find((t) => t.id === id);
}

// Returns an error message when the trip can't be saved, otherwise null.
export async function adminSaveTrip(trip: Trip): Promise<string | null> {
  const slugTaken = mockTrips.some((t) => t.slug === trip.slug && t.id !== trip.id);
  if (slugTaken) return "Kelionė su tokiu adresu (slug) jau egzistuoja.";

  const index = mockTrips.findIndex((t) => t.id === trip.id);
  if (index >= 0) mockTrips[index] = trip;
  else mockTrips.push(trip);
  return null;
}

export async function adminDeleteTrip(id: string): Promise<void> {
  const index = mockTrips.findIndex((t) => t.id === id);
  if (index >= 0) mockTrips.splice(index, 1);
}

// Rebuilds a departure's bus seat list at a new size, keeping the status of
// seats that still exist (so resizing never frees an already-taken seat).
export function resizeSeats(departureId: string, previous: Seat[] | undefined, count: number): Seat[] {
  const labels = generateBusSeatLabels(count);
  return Array.from({ length: count }, (_, i) => ({
    id: previous?.[i]?.id ?? `${departureId}-seat-${i + 1}`,
    seatNumber: labels[i],
    status: previous?.[i]?.status ?? ("FREE" as const),
  }));
}

export function createEmptyDeparture(): Departure {
  return {
    id: `departure-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: "",
    pickupPoints: [],
    durationDays: 1,
    cost: 0,
    discount: null,
    guaranteeThreshold: null,
    guaranteedOverride: false,
    remainingPaymentDays: 5,
    status: "ACTIVE",
    flightSeatsTotal: null,
    flightSeatsTaken: 0,
    seats: [],
    cabinTypes: [],
    extraOptions: [],
  };
}

export function createEmptyTrip(): Trip {
  return {
    id: `trip-${Date.now()}`,
    slug: "",
    title: "",
    shortDescription: "",
    description: "",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "",
    filterTags: [],
    invoiceName: "",
    nextInvoiceNumber: 1,
    isActive: true,
    badgeTag: "",
    images: [],
    programDays: [],
    inclusions: "",
    exclusions: "",
    travellerMemo: "",
    seoTitle: "",
    seoDescription: "",
    departures: [createEmptyDeparture()],
  };
}

const LT_MAP: Record<string, string> = {
  ą: "a",
  č: "c",
  ę: "e",
  ė: "e",
  į: "i",
  š: "s",
  ų: "u",
  ū: "u",
  ž: "z",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, (c) => LT_MAP[c])
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
