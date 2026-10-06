export type TripType = "BUS" | "FLIGHT" | "CRUISE";
export type TripCategory = "SIGHTSEEING" | "LEISURE";
export type DepartureStatus = "ACTIVE" | "DONE" | "ARCHIVED";
export type CabinTypeName = "QUAD" | "DOUBLE" | "TRIPLE";

export interface TripImage {
  url: string;
  alt: string;
  sortOrder: number;
}

export interface PickupPoint {
  city: string;
  time: string;
}

export interface Seat {
  id: string;
  seatNumber: string;
  status: "FREE" | "HELD" | "TAKEN";
}

export interface CabinType {
  id: string;
  type: CabinTypeName;
  pricePerPerson: number;
  totalUnits: number;
  takenUnits: number;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface Departure {
  id: string;
  date: string;
  time: string | null;
  pickupPoints?: PickupPoint[];
  durationDays: number;
  cost: number;
  discount: number | null; // e.g. 20 (meaning 20%)
  guaranteeThreshold: number | null;
  guaranteedOverride: boolean;
  remainingPaymentDays?: number;
  status: DepartureStatus;
  flightSeatsTotal?: number | null;
  flightSeatsTaken?: number;
  seats?: Seat[];
  cabinTypes?: CabinType[];
  extraOptions?: ExtraOption[];
}

export interface ProgramDay {
  day: number;
  title: string;
  description: string;
  imageUrl?: string; // single cover image — kept for trips that only have one
  imageAlt?: string;
  // Optional extra photos for the day (e.g. several stops visited on the
  // same day) — shown as a mini gallery in the Programa tab. Falls back to
  // imageUrl/imageAlt as a single-photo "gallery" when this isn't set, so
  // existing trips don't need migrating just to open in the lightbox.
  images?: TripImage[];
}

export interface Trip {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  tripType: TripType;
  category: TripCategory;
  destinationCountry: string;
  filterTags?: string[];
  invoiceName?: string;
  nextInvoiceNumber?: number;
  isActive?: boolean;
  badgeTag?: string; // e.g., "Paskutinė minutė!", "Paskutinė minutė! Sekmadienis"
  images: TripImage[];
  programDays?: ProgramDay[];
  inclusions?: string[];
  exclusions?: string[];
  // Free-form admin-authored text for the "Atmintinė" tab (what's
  // included/excluded in detail, departure points/times, contract terms,
  // payment instructions, organizer info, etc.) — not every trip has one
  // yet, added per trip as the admin writes it up.
  travellerMemo?: string;
  seoTitle?: string;
  seoDescription?: string;
  departures: Departure[];
}

// Criteria collected by SearchForm and applied by MainCard to narrow which
// trip/departure cards are shown. Shared here (rather than owned by either
// component) since both need the same shape once a real search API replaces
// the client-side filtering in tripHelpers.ts.
export interface TripSearchFilters {
  tripType: TripType;
  category: TripCategory;
  destination: string;
  startDate: string;
  endDate: string;
  /** Upper bound only — the price slider's floor is always 0. */
  maxPrice: number;
}
