import type { Departure, Seat, Trip } from "../types/trip";
import { generateBusSeatLabels, sortBySeatNumber } from "../components/BuySession/busSeatLayout";

// Realus BE kvietimas (ne mock duomenys) — Fazė 2 admin pusė. Sesija
// laikoma httpOnly cookie, tad visur `credentials: "include"`.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const BUS_SIZES = [48, 49, 52, 53] as const;

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? "Įvyko klaida";
  } catch {
    return "Įvyko klaida";
  }
}

export async function adminListTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/api/admin/trips`, { credentials: "include" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function adminGetTrip(id: string): Promise<Trip | undefined> {
  const res = await fetch(`${API_URL}/api/admin/trips/${id}`, { credentials: "include" });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// Returns an error message when the trip can't be saved, otherwise null.
// `isNew` renka POST (sukurti) vs PUT /:id (redaguoti) — BŪTINA perduoti iš
// callerio (žr. AdminTripForm.tsx), nes trip.id visada užpildytas (net
// naujai kelionei createEmptyTrip() priskiria laikiną client-side id), tad
// vien iš trip.id buvimo negalima patikimai spręsti, ar tai create, ar update.
// `force` — leidžia pašalinti jau parduotą vietą/kajutę/išvykimą (admin
// patvirtino įspėjamąjį pranešimą prieš tai, žr. AdminTripForm.tsx). Be jo BE
// atmestų tokį pašalinimą su 409.
export async function adminSaveTrip(trip: Trip, isNew = false, force = false): Promise<string | null> {
  const base = isNew ? `${API_URL}/api/admin/trips` : `${API_URL}/api/admin/trips/${trip.id}`;
  const url = !isNew && force ? `${base}?force=true` : base;
  const res = await fetch(url, {
    method: isNew ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(trip),
  });
  if (!res.ok) return parseErrorMessage(res);
  return null;
}

export async function adminDuplicateTrip(id: string): Promise<Trip> {
  const res = await fetch(`${API_URL}/api/admin/trips/${id}/duplicate`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function adminDeleteTrip(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/trips/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

// Rebuilds a departure's bus seat list at a new size, keeping the status of
// seats that still exist (so resizing never frees an already-taken seat).
// `previous` is sorted by seatNumber first — its array order isn't
// guaranteed to match label order once seats round-trip through the real
// DB (see busSeatLayout.ts's sortBySeatNumber), and this function matches
// old-to-new purely by array index, so an unsorted `previous` would copy
// the wrong seat's id/status into the wrong new position.
export function resizeSeats(departureId: string, previous: Seat[] | undefined, count: number): Seat[] {
  const sortedPrevious = previous ? sortBySeatNumber(previous) : undefined;
  const labels = generateBusSeatLabels(count);
  return Array.from({ length: count }, (_, i) => ({
    id: sortedPrevious?.[i]?.id ?? `${departureId}-seat-${i + 1}`,
    seatNumber: labels[i],
    status: sortedPrevious?.[i]?.status ?? ("FREE" as const),
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
    depositPercentage: null,
    depositDeadline: null,
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
    bannerImage: null,
    images: [],
    programDays: [],
    inclusions: "",
    exclusions: "",
    travellerMemo: "",
    seoTitle: "",
    seoDescription: "",
    departures: [createEmptyDeparture()],
    reviews: [],
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
