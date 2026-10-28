import type {
  Trip,
  Departure,
  TripType,
  TripSearchFilters,
  CabinType,
  CabinTypeName,
  ProgramDay,
  TripImage,
} from "../types/trip";

// Lithuanian numeral-noun agreement: ends in 1 (not 11) → singular
// nominative; ends in 2-9 (not 12-19) → plural nominative; everything else
// (0, 10, 11-19, any ten) → plural genitive. E.g. pluralizeLt(n, "vieta",
// "vietos", "vietų") → "1 vieta", "6 vietos", "11 vietų", "20 vietų".
export function pluralizeLt(
  count: number,
  singular: string,
  pluralNominative: string,
  pluralGenitive: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return singular;
  if (mod10 >= 2 && mod10 <= 9 && !(mod100 >= 12 && mod100 <= 19)) return pluralNominative;
  return pluralGenitive;
}

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
      return "Dvivietė kajutė be lango";
    case "TRIPLE":
      return "Trivietė kajutė be lango";
    case "QUAD":
    default:
      return "Vieta keturvietėje kajutėje be lango";
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

// How many travellers ONE selectable unit covers. QUAD cabins are sold per
// place (1 bed = 1 person, so 4 travellers just pick 4 places), while
// DOUBLE/TRIPLE are sold as whole cabins. Everything that counts headcount
// or price from cabinSelections goes through this, not getCabinCapacity.
export function getCabinUnitSize(type: CabinTypeName): number {
  return type === "QUAD" ? 1 : getCabinCapacity(type);
}

export function getCabinPricing(cabin: CabinType) {
  const discount = cabin.discount ?? 0;
  const hasDiscount = discount > 0;
  const finalPrice = Number(
    (hasDiscount ? cabin.pricePerPerson * (1 - discount / 100) : cabin.pricePerPerson).toFixed(2)
  );
  return { originalPrice: cabin.pricePerPerson, finalPrice, discount, hasDiscount };
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
  if (filters.category && trip.category !== filters.category) return false;

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
  const numStr = value.toLocaleString("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    // cabinSelections counts selectable units (places for QUAD, cabins for
    // DOUBLE/TRIPLE) — each covers getCabinUnitSize(c.type) travellers, all
    // paying the discounted per-person price.
    return (departure.cabinTypes ?? []).reduce(
      (sum, c) =>
        sum + (cabinSelections[c.id] ?? 0) * getCabinUnitSize(c.type) * getCabinPricing(c).finalPrice,
      0
    );
  }
  return getTripPricing(departure).finalCost * travellerCount;
}

export interface CheckoutTotals {
  discountAmount: number;
  discountLabel: string;
  finalTotal: number;
  hasDepositOption: boolean;
  depositAmount: number;
  remainingAmount: number;
  payingDeposit: boolean;
  amountDueNow: number;
  remainingDueDate?: string;
}

// Single source of truth for "how much is due right now" — a discount code
// and a deposit choice (both decided in Step 1 of the buy flow) must affect
// the price shown on every later step the same way, not just the final
// payment page. Takes the CURRENT grand total (which keeps changing as
// seats/extras are picked) so the deposit is always a % of the up-to-date
// total, never a stale number carried forward from an earlier step.
export function getCheckoutTotals(
  grandTotal: number,
  departure: Departure,
  appliedDiscount: { type: "PERCENTAGE" | "FIXED"; value: number } | null | undefined,
  wantsDeposit: boolean | undefined
): CheckoutTotals {
  const discountAmount = !appliedDiscount
    ? 0
    : appliedDiscount.type === "PERCENTAGE"
      ? grandTotal * (appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value, grandTotal);
  const discountLabel = appliedDiscount
    ? appliedDiscount.type === "PERCENTAGE"
      ? `-${appliedDiscount.value}%`
      : `-${appliedDiscount.value} €`
    : "";
  const finalTotal = grandTotal - discountAmount;

  // Compared as date-only strings (not Date objects) so the deadline day
  // itself still allows a deposit — the cutoff only takes effect the day
  // AFTER it.
  const depositPercentage = departure.depositPercentage ?? 0;
  const isPastDepositDeadline = departure.depositDeadline
    ? new Date().toISOString().slice(0, 10) > departure.depositDeadline.slice(0, 10)
    : false;
  const hasDepositOption = depositPercentage > 0 && !isPastDepositDeadline;
  const depositAmount = hasDepositOption
    ? Math.round(finalTotal * (depositPercentage / 100) * 100) / 100
    : 0;
  const remainingAmount = finalTotal - depositAmount;
  const payingDeposit = hasDepositOption && Boolean(wantsDeposit);
  const amountDueNow = payingDeposit ? depositAmount : finalTotal;
  const remainingDueDate =
    payingDeposit && departure.remainingPaymentDays
      ? formatTripDate(
          new Date(
            new Date(departure.date).getTime() -
              departure.remainingPaymentDays * 24 * 60 * 60 * 1000
          ).toISOString()
        )
      : undefined;

  return {
    discountAmount,
    discountLabel,
    finalTotal,
    hasDepositOption,
    depositAmount,
    remainingAmount,
    payingDeposit,
    amountDueNow,
    remainingDueDate,
  };
}

export interface AvailabilityInfo {
  text: string;
  isGuaranteed: boolean;
  isSoldOut: boolean;
}

// Shared by getTripAvailability (below) and the admin departure editor's
// "Garantuota nuo" hint — total/taken headcount, counted consistently
// across all 3 trip types (CRUISE cabins counted in PEOPLE via unit size,
// not raw cabin units). totalSeats is null when the departure has no
// capacity configured at all yet (distinct from a configured-but-empty 0).
export function getDepartureCapacity(departure?: Departure): { totalSeats: number | null; takenSeats: number } {
  if (!departure) return { totalSeats: null, takenSeats: 0 };

  if (departure.seats && departure.seats.length > 0) {
    const totalSeats = departure.seats.length;
    const freeSeats = departure.seats.filter((s) => s.status === "FREE").length;
    return { totalSeats, takenSeats: totalSeats - freeSeats };
  }
  if (departure.flightSeatsTotal != null) {
    return { totalSeats: departure.flightSeatsTotal, takenSeats: departure.flightSeatsTaken ?? 0 };
  }
  if (departure.cabinTypes && departure.cabinTypes.length > 0) {
    // Units differ per type (places vs cabins), so count people.
    const totalSeats = departure.cabinTypes.reduce((acc, c) => acc + c.totalUnits * getCabinUnitSize(c.type), 0);
    const takenSeats = departure.cabinTypes.reduce((acc, c) => acc + c.takenUnits * getCabinUnitSize(c.type), 0);
    return { totalSeats, takenSeats };
  }
  return { totalSeats: null, takenSeats: 0 };
}

export function getTripAvailability(departure?: Departure): AvailabilityInfo {
  if (!departure) {
    return { text: "vietų yra", isGuaranteed: false, isSoldOut: false };
  }

  const { totalSeats, takenSeats } = getDepartureCapacity(departure);
  const freeSeats = totalSeats === null ? null : Math.max(0, totalSeats - takenSeats);

  const isSoldOut = freeSeats !== null && freeSeats <= 0;

  let text = "vietų yra";
  if (isSoldOut) {
    text = "vietų nėra";
  } else if (freeSeats !== null && freeSeats <= 15) {
    text = `liko ${freeSeats} viet.`;
  }

  // Guaranteed departure logic: either override is true, or the number of
  // booked travellers reaches an admin-set headcount threshold (people, not
  // a percentage — easier for admins to reason about than a % of capacity).
  // No explicit threshold set → fall back to the same 70%-of-capacity
  // default this always used, just computed as a headcount now.
  const threshold = departure.guaranteeThreshold ?? (totalSeats !== null ? Math.ceil(totalSeats * 0.7) : Infinity);
  const isGuaranteed =
    departure.guaranteedOverride || (totalSeats !== null && totalSeats > 0 && takenSeats >= threshold);

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
