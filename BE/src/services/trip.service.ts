import type { Prisma, TripCategory, TripType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getHeldCabinCount, getHeldFlightCount, getHeldSeatIds } from "./hold.service.js";

export interface TripListFilters {
  tripType?: TripType;
  category?: TripCategory;
  destination?: string;
  startDate?: string;
  endDate?: string;
  maxPrice?: number;
}

const departureSelect = {
  id: true,
  date: true,
  pickupPoints: true,
  durationDays: true,
  cost: true,
  discount: true,
  guaranteeThreshold: true,
  guaranteedOverride: true,
  remainingPaymentDays: true,
  depositPercentage: true,
  depositDeadline: true,
  status: true,
  flightSeatsTotal: true,
  flightSeatsTaken: true,
  seats: { select: { id: true, seatNumber: true, status: true } },
  cabinTypes: {
    select: {
      id: true,
      type: true,
      pricePerPerson: true,
      discount: true,
      totalUnits: true,
      takenUnits: true,
    },
  },
  extraOptions: {
    select: { id: true, name: true, price: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.DepartureSelect;

// Admin-only laukai (invoiceName/nextInvoiceNumber) sąmoningai neįtraukti —
// viešas endpoint'as jų neturi atskleisti.
const tripSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  description: true,
  tripType: true,
  category: true,
  destinationCountry: true,
  filterTags: true,
  isActive: true,
  badgeTag: true,
  bannerImage: true,
  images: true,
  programDays: true,
  inclusions: true,
  exclusions: true,
  travellerMemo: true,
  seoTitle: true,
  seoDescription: true,
  reviews: {
    select: { id: true, authorName: true, comment: true },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.TripSelect;

type RawDeparture = Prisma.DepartureGetPayload<{ select: typeof departureSelect }>;
type RawTrip = Prisma.TripGetPayload<{ select: typeof tripSelect }> & {
  departures: RawDeparture[];
};

// Prisma Decimal serializuojasi į string (ne number) per JSON.stringify —
// FE tikisi plain number kainos laukams, tad konvertuojame eksplicitiškai.
function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function serializeDeparture(departure: RawDeparture) {
  return {
    ...departure,
    cost: Number(departure.cost),
    discount: toNumber(departure.discount),
    cabinTypes: departure.cabinTypes.map((cabin) => ({
      ...cabin,
      pricePerPerson: Number(cabin.pricePerPerson),
      discount: toNumber(cabin.discount),
    })),
    extraOptions: departure.extraOptions.map((extra) => ({
      ...extra,
      price: Number(extra.price),
    })),
  };
}

function serializeTrip(trip: RawTrip) {
  return {
    ...trip,
    departures: trip.departures.map(serializeDeparture),
  };
}

// TIK kelionės DETALĖS endpoint'ui (ne sąrašui, žr. Fazė 4 plano apimties
// apribojimą) — sulieja Postgres Seat.status su aktyviais Redis hold'ais.
// Postgres pats NEKEIČIAMAS — tik šis atsakymas, kad klientas iškart matytų
// kitų vartotojų laikinai pasirinktas vietas/bilietus, nelaukdamas checkout
// transakcijos (ta realaus apsaugojimo garantija lieka Fazė 5).
async function applyHoldAvailability(trip: ReturnType<typeof serializeTrip>) {
  await Promise.all(
    trip.departures.map(async (departure) => {
      const freeSeatIds = departure.seats.filter((s) => s.status === "FREE").map((s) => s.id);
      if (freeSeatIds.length > 0) {
        const held = await getHeldSeatIds(departure.id, freeSeatIds);
        if (held.size > 0) {
          departure.seats = departure.seats.map((s) => (held.has(s.id) ? { ...s, status: "HELD" } : s));
        }
      }

      if (departure.flightSeatsTotal !== null) {
        const heldFlightCount = await getHeldFlightCount(departure.id);
        if (heldFlightCount > 0) {
          departure.flightSeatsTaken += heldFlightCount;
        }
      }

      if (departure.cabinTypes.length > 0) {
        await Promise.all(
          departure.cabinTypes.map(async (cabin) => {
            const heldCabinCount = await getHeldCabinCount(departure.id, cabin.id);
            if (heldCabinCount > 0) {
              cabin.takenUnits += heldCabinCount;
            }
          }),
        );
      }
    }),
  );
  return trip;
}

function buildDepartureFilter(filters: TripListFilters): Prisma.DepartureListRelationFilter {
  const dateFilter: Prisma.DateTimeFilter = {};
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
  if (filters.endDate) dateFilter.lte = new Date(filters.endDate);

  return {
    some: {
      status: "ACTIVE",
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      // Supaprastinta: lygina su baziniu `cost`, ne su galutine (po nuolaidos)
      // kaina — tiksliam getTripPricing() atitikimui reikėtų SQL skaičiavimo su
      // discount procentu. FE šiuo metu šio query param apskritai dar nesiunčia
      // (filtruoja klientu pusėje), tad tikslumas čia nekritiškas kol neprijungta.
      ...(filters.maxPrice !== undefined ? { cost: { lte: filters.maxPrice } } : {}),
    },
  };
}

function buildTripWhere(filters: TripListFilters): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = { isActive: true };

  if (filters.tripType) where.tripType = filters.tripType;
  if (filters.category) where.category = filters.category;
  if (filters.destination) {
    where.OR = [
      { title: { contains: filters.destination, mode: "insensitive" } },
      { destinationCountry: { contains: filters.destination, mode: "insensitive" } },
    ];
  }

  const hasDepartureFilter = filters.startDate || filters.endDate || filters.maxPrice !== undefined;
  where.departures = hasDepartureFilter ? buildDepartureFilter(filters) : { some: { status: "ACTIVE" } };

  return where;
}

export async function listPublicTrips(filters: TripListFilters) {
  const trips = await prisma.trip.findMany({
    where: buildTripWhere(filters),
    select: {
      ...tripSelect,
      departures: { where: { status: "ACTIVE" }, select: departureSelect, orderBy: { date: "asc" } },
    },
  });

  return trips.map(serializeTrip);
}

export async function getPublicTripBySlug(slug: string) {
  const trip = await prisma.trip.findUnique({
    where: { slug },
    select: {
      ...tripSelect,
      departures: { where: { status: "ACTIVE" }, select: departureSelect, orderBy: { date: "asc" } },
    },
  });

  if (!trip || !trip.isActive) {
    return null;
  }

  const serialized = serializeTrip(trip);
  await applyHoldAvailability(serialized);
  return serialized;
}
