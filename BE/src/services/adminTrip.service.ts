import { Prisma } from "@prisma/client";
import { ApiError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";
import { withAuditLog } from "./auditLog.service.js";
import { getHeldCabinCount, getHeldFlightCount, getHeldSeatIds } from "./hold.service.js";
import type { DepartureInput, ReviewInput, TripInput } from "./adminTrip.schemas.js";

type TxClient = Prisma.TransactionClient;

const adminDepartureInclude = {
  seats: true,
  cabinTypes: true,
  extraOptions: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.DepartureInclude;

const adminTripInclude = {
  departures: { include: adminDepartureInclude, orderBy: { date: "asc" } },
  reviews: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.TripInclude;

type AdminDeparture = Prisma.DepartureGetPayload<{ include: typeof adminDepartureInclude }>;
type AdminTrip = Prisma.TripGetPayload<{ include: typeof adminTripInclude }>;

function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function serializeDeparture(departure: AdminDeparture) {
  return {
    ...departure,
    cost: Number(departure.cost),
    discount: toNumber(departure.discount),
    cabinTypes: departure.cabinTypes.map((cabin) => ({
      ...cabin,
      pricePerPerson: Number(cabin.pricePerPerson),
      discount: toNumber(cabin.discount),
    })),
    extraOptions: departure.extraOptions.map((extra) => ({ ...extra, price: Number(extra.price) })),
  };
}

function serializeTrip(trip: AdminTrip) {
  return { ...trip, departures: trip.departures.map(serializeDeparture) };
}

// Admin'ui PRIVALU matyti tą patį, ką mato ir klientas — kitaip adminas
// Rankinio užsakymo (AdminOrderNew) puslapyje ar departūros redaktoriuje
// gali pasirinkti vietą/kajutę, kurią tą akimirką jau aktyviai laiko realus
// klientas per Fazės 4 Redis hold'ą (Postgres dar rodo FREE, bet vieta
// faktiškai "lange"). Tas pats pattern'as kaip trip.service.ts'o viešame
// getPublicTripBySlug() — tik čia pritaikoma admin tipams.
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

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.trip.findUnique({ where: { slug } });
  if (existing && existing.id !== excludeId) {
    throw new ApiError(409, "Šis slug jau naudojamas kitos kelionės");
  }
}

// Dubliavimui — originalo slug/invoiceName niekada tiesiogiai nekopijuojami
// (slug unikalus DB lygmeniu; invoiceName nėra unikalus DB lygmeniu, bet du
// aktyvūs trip'ai su tuo pačiu invoiceName generuotų vienodai atrodančius,
// bet skirtingiems pirkimams priklausančius sąskaitų numerius — žr.
// duplicateAdminTrip() žemiau).
async function uniqueSlug(base: string): Promise<string> {
  let candidate = `${base}-kopija`;
  let n = 2;
  while (await prisma.trip.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-kopija-${n}`;
    n++;
  }
  return candidate;
}

async function uniqueInvoiceName(base: string): Promise<string> {
  let candidate = `${base}2`;
  let n = 3;
  while (await prisma.trip.findFirst({ where: { invoiceName: candidate } })) {
    candidate = `${base}${n}`;
    n++;
  }
  return candidate;
}

function departureScalarData(dep: DepartureInput) {
  return {
    date: new Date(dep.date),
    pickupPoints: dep.pickupPoints,
    durationDays: dep.durationDays,
    cost: dep.cost,
    discount: dep.discount ?? null,
    guaranteeThreshold: dep.guaranteeThreshold ?? null,
    guaranteedOverride: dep.guaranteedOverride,
    remainingPaymentDays: dep.remainingPaymentDays,
    depositPercentage: dep.depositPercentage ?? null,
    depositDeadline: dep.depositDeadline ? new Date(dep.depositDeadline) : null,
    status: dep.status,
    flightSeatsTotal: dep.flightSeatsTotal ?? null,
    // flightSeatsTaken sąmoningai NEĮTRAUKTAS — server-authoritative, keičiamas tik checkout transakcijoje.
  };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function tripScalarData(input: TripInput) {
  return {
    slug: input.slug,
    title: input.title,
    shortDescription: input.shortDescription,
    description: input.description,
    tripType: input.tripType,
    category: input.category,
    destinationCountry: input.destinationCountry,
    filterTags: input.filterTags,
    invoiceName: input.invoiceName,
    isActive: input.isActive,
    badgeTag: input.badgeTag ?? null,
    isLastMinute: input.isLastMinute,
    bannerImage: input.bannerImage === null || input.bannerImage === undefined ? Prisma.JsonNull : toJson(input.bannerImage),
    images: toJson(input.images),
    programDays: toJson(input.programDays),
    inclusions: toJson(input.inclusions),
    exclusions: toJson(input.exclusions),
    travellerMemo: input.travellerMemo ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };
}

// Vietų "sinchronizavimas" prilygsta natūraliam raktui (departureId, seatNumber) —
// kliento siunčiami id nepatikimi (žr. src/services/adminTrip.service.ts komentarą
// prie DepartureInput). HELD/TAKEN niekada neperrašomi iš kliento — server-authoritative,
// saugo nuo stale GET→PUT lenktynių su realiu checkout tarp admin atidarymo ir išsaugojimo.
// FREE↔BLOCKED admin GALI laisvai perjungti (žr. toliau) — tai ne tikras užsakymas,
// tik rankinis "ši vieta priklauso gidui/personalui" pažymėjimas.
function isRealBooking(status: string): boolean {
  return status === "HELD" || status === "TAKEN";
}

async function syncSeats(tx: TxClient, departureId: string, incoming: DepartureInput["seats"], force: boolean) {
  const existing = await tx.seat.findMany({ where: { departureId } });
  const existingByNumber = new Map(existing.map((s) => [s.seatNumber, s]));
  const incomingByNumber = new Map(incoming.map((s) => [s.seatNumber, s]));
  const incomingNumbers = new Set(incoming.map((s) => s.seatNumber));

  const toRemove = existing.filter((s) => !incomingNumbers.has(s.seatNumber));
  if (!force) {
    const blockedRemoval = toRemove.find((s) => isRealBooking(s.status));
    if (blockedRemoval) {
      throw new ApiError(409, `Negalima pašalinti vietos ${blockedRemoval.seatNumber} — ji jau laikoma arba parduota.`);
    }
  }

  if (toRemove.length > 0) {
    await tx.seat.deleteMany({ where: { id: { in: toRemove.map((s) => s.id) } } });
  }

  for (const seat of incoming) {
    const existingSeat = existingByNumber.get(seat.seatNumber);
    if (!existingSeat) {
      await tx.seat.create({
        data: { departureId, seatNumber: seat.seatNumber, status: seat.status === "BLOCKED" ? "BLOCKED" : "FREE" },
      });
      continue;
    }

    if (isRealBooking(existingSeat.status)) {
      continue; // tikras užsakymas — niekada neliečiamas šiuo keliu
    }

    const nextStatus = incomingByNumber.get(seat.seatNumber)?.status === "BLOCKED" ? "BLOCKED" : "FREE";
    if (nextStatus !== existingSeat.status) {
      await tx.seat.update({ where: { id: existingSeat.id }, data: { status: nextStatus } });
    }
  }
}

// CabinType yra force-pašalinimo tikslinis FK (Traveller.cabinTypeId REALIAI
// nurodo į jį, skirtingai nuo Seat — Seat.travellerId yra kitoje pusėje) —
// prieš trinant, Traveller nuorodos turi būti atpalaiduotos (set null), kitaip
// DB FK constraint tiesiog meta klaidą vietoj numatyto force-delete.
async function releaseCabinTypeTravellers(tx: TxClient, cabinTypeIds: string[]) {
  if (cabinTypeIds.length === 0) return;
  await tx.traveller.updateMany({ where: { cabinTypeId: { in: cabinTypeIds } }, data: { cabinTypeId: null } });
}

// Kajutės tipo "sinchronizavimas" prilygsta natūraliam raktui (departureId, type).
// takenUnits NIEKADA neperrašomas iš kliento. totalUnits<takenUnits sumažinimas
// blokuojamas VISADA (net su force) — tai ne pašalinimas, o nelogiška "oversold"
// būsena be jokios atitinkamos DB eilutės veiksmo; force taikomas tik PAŠALINIMUI.
async function syncCabinTypes(
  tx: TxClient,
  departureId: string,
  incoming: DepartureInput["cabinTypes"],
  force: boolean,
) {
  const existing = await tx.cabinType.findMany({ where: { departureId } });
  const existingByType = new Map(existing.map((c) => [c.type, c]));
  const incomingTypes = new Set(incoming.map((c) => c.type));

  const toRemove = existing.filter((c) => !incomingTypes.has(c.type));
  if (!force) {
    const blockedRemoval = toRemove.find((c) => c.takenUnits > 0);
    if (blockedRemoval) {
      throw new ApiError(409, `Negalima pašalinti kajutės tipo ${blockedRemoval.type} — yra parduotų vietų.`);
    }
  }
  if (toRemove.length > 0) {
    await releaseCabinTypeTravellers(tx, toRemove.map((c) => c.id));
    await tx.cabinType.deleteMany({ where: { id: { in: toRemove.map((c) => c.id) } } });
  }

  for (const cabin of incoming) {
    const existingCabin = existingByType.get(cabin.type);
    if (existingCabin) {
      if (cabin.totalUnits < existingCabin.takenUnits) {
        throw new ApiError(
          409,
          `Kajutės tipo ${cabin.type} vietų skaičius negali būti mažesnis už jau parduotą kiekį (${existingCabin.takenUnits}).`,
        );
      }
      await tx.cabinType.update({
        where: { id: existingCabin.id },
        data: {
          pricePerPerson: cabin.pricePerPerson,
          discount: cabin.discount ?? null,
          totalUnits: cabin.totalUnits,
        },
      });
    } else {
      await tx.cabinType.create({
        data: {
          departureId,
          type: cabin.type,
          pricePerPerson: cabin.pricePerPerson,
          discount: cabin.discount ?? null,
          totalUnits: cabin.totalUnits,
        },
      });
    }
  }
}

// extraOptions/reviews neturi jokio užsakymų ryšio (nėra booking-derived būsenos),
// tad pilnas diff pagal DB id yra saugus: atpažintas DB id → update, kitaip → create,
// o DB eilutės, kurių nebėra tarp atpažintų, trinamos.
async function syncExtraOptions(tx: TxClient, departureId: string, incoming: DepartureInput["extraOptions"]) {
  const existing = await tx.extraOption.findMany({ where: { departureId } });
  const existingIds = new Set(existing.map((e) => e.id));
  const matchedIds = new Set<string>();

  for (const [index, extra] of incoming.entries()) {
    if (extra.id && existingIds.has(extra.id)) {
      matchedIds.add(extra.id);
      await tx.extraOption.update({
        where: { id: extra.id },
        data: { name: extra.name, price: extra.price, sortOrder: index },
      });
    } else {
      await tx.extraOption.create({
        data: { departureId, name: extra.name, price: extra.price, sortOrder: index },
      });
    }
  }

  const toDelete = existing.filter((e) => !matchedIds.has(e.id));
  if (toDelete.length > 0) {
    await tx.extraOption.deleteMany({ where: { id: { in: toDelete.map((e) => e.id) } } });
  }
}

async function syncReviews(tx: TxClient, tripId: string, incoming: ReviewInput[], existing: { id: string }[]) {
  const existingIds = new Set(existing.map((r) => r.id));
  const matchedIds = new Set<string>();

  for (const review of incoming) {
    if (review.id && existingIds.has(review.id)) {
      matchedIds.add(review.id);
      await tx.review.update({
        where: { id: review.id },
        data: { authorName: review.authorName, comment: review.comment },
      });
    } else {
      await tx.review.create({ data: { tripId, authorName: review.authorName, comment: review.comment } });
    }
  }

  const toDelete = existing.filter((r) => !matchedIds.has(r.id));
  if (toDelete.length > 0) {
    await tx.review.deleteMany({ where: { id: { in: toDelete.map((r) => r.id) } } });
  }
}

function assertDepartureRemovable(
  departure: {
    seats: { status: string }[];
    cabinTypes: { takenUnits: number }[];
    flightSeatsTaken: number;
  },
  force: boolean,
) {
  if (force) return;
  // BLOCKED (gidui/personalui) NĖRA tikras užsakymas — tik HELD/TAKEN blokuoja
  // pašalinimą be force (žr. isRealBooking() aukščiau, syncSeats/syncCabinTypes
  // naudoja tą pačią taisyklę; ši funkcija anksčiau klaidingai tikrino bet kokį
  // ne-FREE statusą, dėl ko BLOCKED vieta nepagrįstai blokuodavo išvykimo trynimą).
  const hasBookedSeat = departure.seats.some((s) => isRealBooking(s.status));
  const hasBookedCabin = departure.cabinTypes.some((c) => c.takenUnits > 0);
  if (hasBookedSeat || hasBookedCabin || departure.flightSeatsTaken > 0) {
    throw new ApiError(409, "Negalima pašalinti išvykimo — yra parduotų vietų/bilietų.");
  }
}

export async function listAdminTrips() {
  const trips = await prisma.trip.findMany({ include: adminTripInclude, orderBy: { createdAt: "desc" } });
  const serialized = trips.map(serializeTrip);
  await Promise.all(serialized.map(applyHoldAvailability));
  return serialized;
}

export async function getAdminTripById(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id }, include: adminTripInclude });
  if (!trip) {
    throw new ApiError(404, "Kelionė nerasta");
  }
  const serialized = serializeTrip(trip);
  await applyHoldAvailability(serialized);
  return serialized;
}

export async function createAdminTrip(input: TripInput, adminId: string) {
  await assertSlugAvailable(input.slug);

  const trip = await withAuditLog(
    (tx) =>
      tx.trip.create({
        data: {
          ...tripScalarData(input),
          departures: {
            create: input.departures.map((dep) => ({
              ...departureScalarData(dep),
              seats: { create: dep.seats.map((s) => ({ seatNumber: s.seatNumber, status: s.status === "BLOCKED" ? "BLOCKED" : "FREE" })) },
              cabinTypes: {
                create: dep.cabinTypes.map((c) => ({
                  type: c.type,
                  pricePerPerson: c.pricePerPerson,
                  discount: c.discount ?? null,
                  totalUnits: c.totalUnits,
                })),
              },
              extraOptions: {
                create: dep.extraOptions.map((e, i) => ({ name: e.name, price: e.price, sortOrder: i })),
              },
            })),
          },
          reviews: { create: input.reviews.map((r) => ({ authorName: r.authorName, comment: r.comment })) },
        },
        include: adminTripInclude,
      }),
    (createdTrip) => ({
      adminId,
      action: "trip.create",
      entityType: "Trip",
      entityId: createdTrip.id,
      payload: { slug: createdTrip.slug, title: createdTrip.title },
    }),
  );

  return serializeTrip(trip);
}

export async function duplicateAdminTrip(id: string, adminId: string) {
  const original = await prisma.trip.findUnique({ where: { id }, include: adminTripInclude });
  if (!original) {
    throw new ApiError(404, "Kelionė nerasta");
  }

  const [newSlug, newInvoiceName] = await Promise.all([
    uniqueSlug(original.slug),
    uniqueInvoiceName(original.invoiceName),
  ]);

  const trip = await withAuditLog(
    (tx) =>
      tx.trip.create({
        data: {
          slug: newSlug,
          title: `${original.title} (kopija)`,
          shortDescription: original.shortDescription,
          description: original.description,
          tripType: original.tripType,
          category: original.category,
          destinationCountry: original.destinationCountry,
          filterTags: original.filterTags,
          invoiceName: newInvoiceName,
          isActive: false, // VISADA false po dubliavimo, nepriklausomai nuo originalo
          badgeTag: original.badgeTag,
          isLastMinute: original.isLastMinute,
          bannerImage: original.bannerImage === null ? Prisma.JsonNull : toJson(original.bannerImage),
          images: toJson(original.images),
          programDays: toJson(original.programDays),
          inclusions: toJson(original.inclusions),
          exclusions: toJson(original.exclusions),
          travellerMemo: original.travellerMemo,
          seoTitle: original.seoTitle,
          seoDescription: original.seoDescription,
          departures: {
            create: original.departures.map((dep) => ({
              date: dep.date, // KOPIJUOJAMA kaip yra — admin pats pakoreguos
              pickupPoints: toJson(dep.pickupPoints),
              durationDays: dep.durationDays,
              cost: dep.cost,
              discount: dep.discount,
              guaranteeThreshold: dep.guaranteeThreshold,
              guaranteedOverride: dep.guaranteedOverride,
              remainingPaymentDays: dep.remainingPaymentDays,
              depositPercentage: dep.depositPercentage,
              depositDeadline: dep.depositDeadline,
              status: dep.status,
              flightSeatsTotal: dep.flightSeatsTotal,
              // flightSeatsTaken NEĮTRAUKTAS — numatyta 0, server-authoritative
              // (ta pati konvencija kaip createAdminTrip).
              seats: {
                // TIK seatNumber + BLOCKED/FREE — niekada TAKEN/HELD/travellerId
                // (tai priklauso realiems Order/Traveller originalo trip'e).
                // Identiška taisyklė kaip createAdminTrip aukščiau.
                create: dep.seats.map((s) => ({
                  seatNumber: s.seatNumber,
                  status: s.status === "BLOCKED" ? "BLOCKED" : "FREE",
                })),
              },
              cabinTypes: {
                // takenUnits NEĮTRAUKTAS — numatyta 0 (niekada nekopijuojama parduota būsena).
                create: dep.cabinTypes.map((c) => ({
                  type: c.type,
                  pricePerPerson: c.pricePerPerson,
                  discount: c.discount,
                  totalUnits: c.totalUnits,
                })),
              },
              extraOptions: {
                create: dep.extraOptions.map((e) => ({ name: e.name, price: e.price, sortOrder: e.sortOrder })),
              },
            })),
          },
          reviews: {
            create: original.reviews.map((r) => ({ authorName: r.authorName, comment: r.comment })),
          },
        },
        include: adminTripInclude,
      }),
    (createdTrip) => ({
      adminId,
      action: "trip.duplicate",
      entityType: "Trip",
      entityId: createdTrip.id,
      payload: { sourceTripId: original.id, slug: createdTrip.slug, title: createdTrip.title },
    }),
  );

  return serializeTrip(trip);
}

export async function updateAdminTrip(id: string, input: TripInput, adminId: string, force = false) {
  await assertSlugAvailable(input.slug, id);

  const trip = await withAuditLog(
    async (tx) => {
      const existingTrip = await tx.trip.findUnique({
        where: { id },
        include: { departures: { include: { seats: true, cabinTypes: true } }, reviews: true },
      });
      if (!existingTrip) {
        throw new ApiError(404, "Kelionė nerasta");
      }

      const incomingDepartureIds = new Set(
        input.departures.filter((d): d is DepartureInput & { id: string } => Boolean(d.id)).map((d) => d.id),
      );
      const departuresToRemove = existingTrip.departures.filter((d) => !incomingDepartureIds.has(d.id));
      for (const dep of departuresToRemove) {
        assertDepartureRemovable(dep, force);
      }
      if (departuresToRemove.length > 0) {
        const removeIds = departuresToRemove.map((d) => d.id);
        const cabinTypeIds = departuresToRemove.flatMap((d) => d.cabinTypes.map((c) => c.id));
        await releaseCabinTypeTravellers(tx, cabinTypeIds);
        await tx.seat.deleteMany({ where: { departureId: { in: removeIds } } });
        await tx.cabinType.deleteMany({ where: { departureId: { in: removeIds } } });
        await tx.extraOption.deleteMany({ where: { departureId: { in: removeIds } } });
        await tx.departure.deleteMany({ where: { id: { in: removeIds } } });
      }

      const existingDepById = new Map(existingTrip.departures.map((d) => [d.id, d]));
      for (const dep of input.departures) {
        const existingDep = dep.id ? existingDepById.get(dep.id) : undefined;
        if (existingDep) {
          await tx.departure.update({ where: { id: existingDep.id }, data: departureScalarData(dep) });
          await syncSeats(tx, existingDep.id, dep.seats, force);
          await syncCabinTypes(tx, existingDep.id, dep.cabinTypes, force);
          await syncExtraOptions(tx, existingDep.id, dep.extraOptions);
        } else {
          await tx.departure.create({
            data: {
              tripId: id,
              ...departureScalarData(dep),
              seats: { create: dep.seats.map((s) => ({ seatNumber: s.seatNumber, status: s.status === "BLOCKED" ? "BLOCKED" : "FREE" })) },
              cabinTypes: {
                create: dep.cabinTypes.map((c) => ({
                  type: c.type,
                  pricePerPerson: c.pricePerPerson,
                  discount: c.discount ?? null,
                  totalUnits: c.totalUnits,
                })),
              },
              extraOptions: {
                create: dep.extraOptions.map((e, i) => ({ name: e.name, price: e.price, sortOrder: i })),
              },
            },
          });
        }
      }

      await syncReviews(tx, id, input.reviews, existingTrip.reviews);

      return tx.trip.update({ where: { id }, data: tripScalarData(input), include: adminTripInclude });
    },
    (updatedTrip) => ({
      adminId,
      action: "trip.update",
      entityType: "Trip",
      entityId: updatedTrip.id,
      payload: { slug: updatedTrip.slug, title: updatedTrip.title, forced: force },
    }),
  );

  return serializeTrip(trip);
}

export async function deleteAdminTrip(id: string, adminId: string) {
  return withAuditLog(
    async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) {
        throw new ApiError(404, "Kelionė nerasta");
      }

      const hasOrders = await tx.order.findFirst({ where: { departure: { tripId: id } } });
      if (hasOrders) {
        await tx.trip.update({ where: { id }, data: { isActive: false } });
        return { id, slug: trip.slug, softDeleted: true };
      }

      const departureIds = (await tx.departure.findMany({ where: { tripId: id }, select: { id: true } })).map(
        (d) => d.id,
      );
      await tx.seat.deleteMany({ where: { departureId: { in: departureIds } } });
      await tx.cabinType.deleteMany({ where: { departureId: { in: departureIds } } });
      await tx.extraOption.deleteMany({ where: { departureId: { in: departureIds } } });
      await tx.departure.deleteMany({ where: { tripId: id } });
      await tx.review.deleteMany({ where: { tripId: id } });
      await tx.trip.delete({ where: { id } });

      return { id, slug: trip.slug, softDeleted: false };
    },
    (result) => ({
      adminId,
      action: "trip.delete",
      entityType: "Trip",
      entityId: result.id,
      payload: { slug: result.slug, softDeleted: result.softDeleted },
    }),
  );
}
