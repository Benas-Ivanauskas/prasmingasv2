import type {
  Trip,
  Departure,
  TripType,
  TripSearchFilters,
  CabinTypeName,
  ProgramDay,
  TripImage,
} from "../types/trip";

// A day's actual photo set — its own `images` if the admin added several,
// else its single `imageUrl` as a one-photo "gallery", else none. Lets both
// the Programa tab and the lightbox treat every day the same way regardless
// of which field it was authored with.
export function getProgramDayPhotos(day: ProgramDay): TripImage[] {
  if (day.images && day.images.length > 0) return day.images;
  if (day.imageUrl) return [{ url: day.imageUrl, alt: day.imageAlt || day.title, sortOrder: 0 }];
  return [];
}

export function getTripTypeLabel(type: TripType): string {
  switch (type) {
    case "FLIGHT":
      return "Lėktuvu";
    case "CRUISE":
      return "Kruizas";
    case "BUS":
    default:
      return "Autobusu";
  }
}

export function getCabinTypeLabel(type: CabinTypeName): string {
  switch (type) {
    case "DOUBLE":
      return "2 vietų kajutė";
    case "TRIPLE":
      return "3 vietų kajutė";
    case "QUAD":
    default:
      return "4 vietų kajutė";
  }
}

// How many travellers one cabin of this type sleeps — the cabin-type name
// itself is the source of truth (DOUBLE=2/TRIPLE=3/QUAD=4), so this is the
// one place that maps it to a number the rest of the booking flow can use.
export function getCabinCapacity(type: CabinTypeName): number {
  switch (type) {
    case "DOUBLE":
      return 2;
    case "TRIPLE":
      return 3;
    case "QUAD":
    default:
      return 4;
  }
}

export function getTripDepartures(trip: Trip): Departure[] {
  if (!trip.departures || trip.departures.length === 0) return [];
  return [...trip.departures].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    return dateA.localeCompare(dateB);
  });
}

export interface TripCardEntry {
  trip: Trip;
  departure: Departure;
}

// A trip with multiple departures renders as one card per departure, each
// showing a different date as its "main" date while still exposing every
// date for that trip through the card's own expand toggle.
export function getTripCardEntries(trips: Trip[]): TripCardEntry[] {
  return trips.flatMap((trip) =>
    getTripDepartures(trip).map((departure) => ({ trip, departure }))
  );
}

// Applies SearchForm's criteria to a single trip/departure card. Kept as a
// pure client-side predicate for now — once a real search API exists, this
// filtering moves server-side and the request body becomes TripSearchFilters
// as-is.
export function matchesSearchFilters(
  entry: TripCardEntry,
  filters: TripSearchFilters | null
): boolean {
  if (!filters) return true;
  const { trip, departure } = entry;

  if (trip.tripType !== filters.tripType) return false;
  if (trip.category !== filters.category) return false;

  const query = filters.destination.trim().toLowerCase();
  if (query) {
    const haystack = `${trip.title} ${trip.destinationCountry}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  const departureDate = formatTripDate(departure.date);
  if (filters.startDate && departureDate < filters.startDate) return false;
  if (filters.endDate && departureDate > filters.endDate) return false;

  if (getTripPricing(departure).finalCost > filters.maxPrice) return false;

  return true;
}

export interface TripPricing {
  originalCost: number;
  finalCost: number;
  discount: number;
  hasDiscount: boolean;
  formattedFinalPrice: string;
  formattedOriginalPrice: string;
  formattedFooterFinal: string;
  formattedFooterOriginal: string;
}

// The one place a euro amount gets turned into display text — every page
// that used to build its own `${value.toLocaleString("lt-LT")} €` string
// inline now calls this instead, so formatting (locale, thousands
// separator, decimal comma) stays consistent everywhere.
export function formatEuro(value: number, withSpace = true): string {
  const numStr = value.toLocaleString("lt-LT");
  return withSpace ? `${numStr} €` : `${numStr}€`;
}

export function getTripPricing(departure?: Departure): TripPricing {
  if (!departure) {
    return {
      originalCost: 0,
      finalCost: 0,
      discount: 0,
      hasDiscount: false,
      formattedFinalPrice: formatEuro(0),
      formattedOriginalPrice: formatEuro(0),
      formattedFooterFinal: formatEuro(0, false),
      formattedFooterOriginal: formatEuro(0, false),
    };
  }

  const originalCost = departure.cost;
  const discount = departure.discount ?? 0;
  const hasDiscount = discount > 0;
  const calculated = hasDiscount ? originalCost * (1 - discount / 100) : originalCost;
  const finalCost = Number(calculated.toFixed(2));

  return {
    originalCost,
    finalCost,
    discount,
    hasDiscount,
    formattedFinalPrice: formatEuro(finalCost),
    formattedOriginalPrice: formatEuro(originalCost),
    formattedFooterFinal: formatEuro(finalCost, false),
    formattedFooterOriginal: formatEuro(originalCost, false),
  };
}

// CRUISE prices by cabin type, not by the departure's flat per-person cost —
// mirrors the total BuyOneSession already computes for cabin selections, so
// later steps (traveller info, payment) show the same number the user picked.
export function getBookingBaseTotal(
  trip: Trip,
  departure: Departure,
  travellerCount: number,
  cabinSelections?: Record<string, number>
): number {
  if (trip.tripType === "CRUISE" && cabinSelections) {
    // cabinSelections counts CABINS, not people — each one sleeps
    // getCabinCapacity(c.type) travellers, all paying pricePerPerson.
    return (departure.cabinTypes ?? []).reduce(
      (sum, c) =>
        sum + (cabinSelections[c.id] ?? 0) * getCabinCapacity(c.type) * c.pricePerPerson,
      0
    );
  }
  return getTripPricing(departure).finalCost * travellerCount;
}

export interface AvailabilityInfo {
  text: string;
  isGuaranteed: boolean;
  isSoldOut: boolean;
}

export function getTripAvailability(departure?: Departure): AvailabilityInfo {
  if (!departure) {
    return { text: "vietų yra", isGuaranteed: false, isSoldOut: false };
  }

  let freeSeats: number | null = null;
  let totalSeats = 0;
  let takenSeats = 0;

  if (departure.seats && departure.seats.length > 0) {
    totalSeats = departure.seats.length;
    freeSeats = departure.seats.filter((s) => s.status === "FREE").length;
    takenSeats = totalSeats - freeSeats;
  } else if (departure.flightSeatsTotal != null) {
    totalSeats = departure.flightSeatsTotal;
    takenSeats = departure.flightSeatsTaken ?? 0;
    freeSeats = Math.max(0, totalSeats - takenSeats);
  } else if (departure.cabinTypes && departure.cabinTypes.length > 0) {
    totalSeats = departure.cabinTypes.reduce((acc, c) => acc + c.totalUnits, 0);
    takenSeats = departure.cabinTypes.reduce((acc, c) => acc + c.takenUnits, 0);
    freeSeats = Math.max(0, totalSeats - takenSeats);
  }

  const isSoldOut = freeSeats !== null && freeSeats <= 0;

  let text = "vietų yra";
  if (isSoldOut) {
    text = "vietų nėra";
  } else if (freeSeats !== null && freeSeats <= 15) {
    text = `liko ${freeSeats} viet.`;
  }

  // Guaranteed departure logic: either override is true or percentage of taken seats exceeds threshold
  const threshold = departure.guaranteeThreshold || 70;
  const takenPercent = totalSeats > 0 ? (takenSeats / totalSeats) * 100 : 0;
  const isGuaranteed = departure.guaranteedOverride || (totalSeats > 0 && takenPercent >= threshold);

  return {
    text,
    isGuaranteed,
    isSoldOut,
  };
}

// Unsplash serves any resolution via the `w=` query param — the mock images
// are stored at a thumbnail-friendly 800px, which looks soft blown up to a
// full-width hero. Re-request a larger version instead of hardcoding bigger
// URLs in the mock data; a real image CDN would take the same kind of param.
export function getScaledImageUrl(url: string, width: number): string {
  if (!url.includes("images.unsplash.com")) return url;
  const base = url.split("?")[0];
  return `${base}?auto=format&fit=crop&w=${width}&q=80`;
}

export function formatTripDate(isoDateStr?: string): string {
  if (!isoDateStr) return "";
  try {
    return isoDateStr.split("T")[0];
  } catch {
    return isoDateStr;
  }
}
