import { z } from "zod";

// `id` visur optional/laisvas string — FE siunčia arba realų DB id (redaguojant),
// arba kliento sugalvotą laikiną id (naują eilutę pridėjus), ir šių du neatskiria
// jokia žyma. Serviso pusėje id naudojamas TIK kaip "ar toks DB id egzistuoja?"
// patikra (žr. adminTrip.service.ts sync* funkcijas) — niekada aklai pasitikima.

const seatSchema = z.object({
  id: z.string().optional(),
  seatNumber: z.string().min(1),
  // HELD/TAKEN ignoruojama server-side (tikras užsakymas, žr. adminTrip.service.ts
  // isRealBooking()); FREE/BLOCKED admin gali laisvai perjungti (gidui/personalui).
  status: z.enum(["FREE", "HELD", "TAKEN", "BLOCKED"]).optional(),
});

const cabinTypeSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["QUAD", "DOUBLE", "TRIPLE"]),
  pricePerPerson: z.number().nonnegative(),
  discount: z.number().nullable().optional(),
  totalUnits: z.number().int().nonnegative(),
  takenUnits: z.number().int().nonnegative().optional(), // ignoruojama server-side
});

const extraOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  sortOrder: z.number().optional(),
});

const reviewSchema = z.object({
  id: z.string().optional(),
  authorName: z.string().min(1),
  comment: z.string().min(1),
});

const departureSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1),
  pickupPoints: z.array(z.object({ city: z.string() })).default([]),
  durationDays: z.number().int().positive(),
  cost: z.number().nonnegative(),
  discount: z.number().nullable().optional(),
  guaranteeThreshold: z.number().nullable().optional(),
  guaranteedOverride: z.boolean().default(false),
  remainingPaymentDays: z.number().int().default(5),
  depositPercentage: z.number().nullable().optional(),
  depositDeadline: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "DONE", "ARCHIVED"]).default("ACTIVE"),
  flightSeatsTotal: z.number().int().nullable().optional(),
  seats: z.array(seatSchema).default([]),
  cabinTypes: z.array(cabinTypeSchema).default([]),
  extraOptions: z.array(extraOptionSchema).default([]),
});

export const tripInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  tripType: z.enum(["BUS", "FLIGHT", "CRUISE"]),
  category: z.enum(["SIGHTSEEING", "LEISURE"]),
  destinationCountry: z.string().min(1),
  filterTags: z.array(z.string()).default([]),
  invoiceName: z.string().min(1),
  isActive: z.boolean().default(true),
  badgeTag: z.string().nullable().optional(),
  bannerImage: z.unknown().nullable().optional(),
  images: z.array(z.unknown()).default([]),
  programDays: z.array(z.unknown()).default([]),
  inclusions: z.unknown().default([]),
  exclusions: z.unknown().default([]),
  travellerMemo: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  departures: z.array(departureSchema).min(1, "Bent vienas išvykimas privalomas"),
  reviews: z.array(reviewSchema).default([]),
});

export type TripInput = z.infer<typeof tripInputSchema>;
export type DepartureInput = z.infer<typeof departureSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
