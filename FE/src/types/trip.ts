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
}

export interface Seat {
  id: string;
  seatNumber: string;
  status: "FREE" | "HELD" | "TAKEN" | "BLOCKED"; // BLOCKED = adminas rezervavo gidui/personalui, niekad viešai nesiūloma
}

export interface CabinType {
  id: string;
  type: CabinTypeName;
  pricePerPerson: number; // full (pre-discount) price
  discount?: number | null; // e.g. 20 (meaning 20%)
  // QUAD is sold per PLACE (people); DOUBLE/TRIPLE per whole CABIN.
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
  pickupPoints?: PickupPoint[];
  durationDays: number;
  cost: number;
  discount: number | null; // e.g. 20 (meaning 20%)
  guaranteeThreshold: number | null;
  guaranteedOverride: boolean;
  remainingPaymentDays?: number;
  // e.g. 30 meaning a 30% deposit option is offered at checkout; null/0/
  // unset means full payment only (today's default behavior).
  depositPercentage?: number | null;
  // Last day the deposit option is still offered — on/before this date, both
  // full and deposit are available; after it, checkout falls back to full
  // payment only even if depositPercentage is still set. null/unset = no cutoff.
  depositDeadline?: string | null;
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
  // shortDescription / description / programDays[].description / travellerMemo
  // may be HTML from the admin rich text editor or legacy plain text.
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
  // Separate admin toggle from badgeTag above — shows a red ribbon badge on
  // the card's PHOTO (top-right corner, TripCard.tsx), not the small text
  // tag under the title. Independent of badgeTag; either/both/neither.
  isLastMinute?: boolean;
  // Wide/panoramic format for the /kelione/:slug cover ONLY (TripHero) —
  // separate from images[0], which is used everywhere else (list card,
  // buy-session sidebar, overview gallery). Falls back to images[0] when
  // unset, so existing trips need no migration.
  bannerImage?: TripImage | null;
  images: TripImage[];
  programDays?: ProgramDay[];
  // Rich text (HTML) from the admin editor. Older data is a plain list of
  // strings — RichText/RichTextEditor accept both.
  inclusions?: string | string[];
  exclusions?: string | string[];
  // Free-form admin-authored text for the "Atmintinė" tab (what's
  // included/excluded in detail, departure points/times, contract terms,
  // payment instructions, organizer info, etc.) — not every trip has one
  // yet, added per trip as the admin writes it up.
  travellerMemo?: string;
  seoTitle?: string;
  seoDescription?: string;
  departures: Departure[];
  reviews?: Review[];
}

// Keliautojų atsiliepimas — tik rodymas (admin-authored), be lankytojo
// pateikimo formos šiuo metu. Veidrodis BE/schema.prisma's Review modelio,
// be rating/isPublished laukų (nėra admin moderavimo UI dar).
export interface Review {
  id: string;
  authorName: string;
  comment: string;
}

// Criteria collected by SearchForm and applied by MainCard to narrow which
// trip/departure cards are shown. Shared here (rather than owned by either
// component) since both need the same shape once a real search API replaces
// the client-side filtering in tripHelpers.ts.
export interface TripSearchFilters {
  tripType: TripType;
  // Optional — by default nothing is selected in SearchForm, meaning "any category".
  category?: TripCategory;
  destination: string;
  startDate: string;
  endDate: string;
  /** Upper bound only — the price slider's floor is always 0. */
  maxPrice: number;
}
