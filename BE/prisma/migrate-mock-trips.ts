// Vienkartinis importas: perkelia FE/trip.ts mock katalogą į realų Postgres,
// kad vieša pusė (dabar jau einanti per realų GET /api/trips) vėl rodytų
// visas kelionmnes, ne tik testinę. Paleidimas: `npx tsx prisma/migrate-mock-trips.ts`.
// Idempotentiškas — pakartotas paleidimas praleidžia jau importuotus slug'us.
import { mockTrips } from "../../FE/trip.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  let imported = 0;
  let skipped = 0;

  for (const trip of mockTrips) {
    const existing = await prisma.trip.findUnique({ where: { slug: trip.slug } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.trip.create({
      data: {
        slug: trip.slug,
        title: trip.title,
        shortDescription: trip.shortDescription ?? "",
        description: trip.description ?? "",
        tripType: trip.tripType,
        category: trip.category,
        destinationCountry: trip.destinationCountry,
        filterTags: trip.filterTags ?? [],
        invoiceName: trip.invoiceName || trip.slug.slice(0, 10).toUpperCase(),
        nextInvoiceNumber: trip.nextInvoiceNumber ?? 1,
        isActive: trip.isActive ?? true,
        badgeTag: trip.badgeTag || null,
        bannerImage: trip.bannerImage ?? undefined,
        images: trip.images ?? [],
        programDays: trip.programDays ?? [],
        inclusions: trip.inclusions ?? [],
        exclusions: trip.exclusions ?? [],
        travellerMemo: trip.travellerMemo || null,
        seoTitle: trip.seoTitle || null,
        seoDescription: trip.seoDescription || null,
        departures: {
          create: trip.departures.map((dep) => ({
            date: new Date(dep.date),
            pickupPoints: dep.pickupPoints ?? [],
            durationDays: dep.durationDays,
            cost: dep.cost,
            discount: dep.discount ?? null,
            guaranteeThreshold: dep.guaranteeThreshold ?? null,
            guaranteedOverride: dep.guaranteedOverride ?? false,
            remainingPaymentDays: dep.remainingPaymentDays ?? 5,
            depositPercentage: dep.depositPercentage ?? null,
            depositDeadline: dep.depositDeadline ? new Date(dep.depositDeadline) : null,
            status: dep.status ?? "ACTIVE",
            flightSeatsTotal: dep.flightSeatsTotal ?? null,
            flightSeatsTaken: dep.flightSeatsTaken ?? 0,
            seats: {
              create: (dep.seats ?? []).map((s) => ({ seatNumber: s.seatNumber, status: s.status })),
            },
            cabinTypes: {
              create: (dep.cabinTypes ?? []).map((c) => ({
                type: c.type,
                pricePerPerson: c.pricePerPerson,
                discount: c.discount ?? null,
                totalUnits: c.totalUnits,
                takenUnits: c.takenUnits ?? 0,
              })),
            },
            extraOptions: {
              create: (dep.extraOptions ?? []).map((e, i) => ({
                name: e.name,
                price: e.price,
                sortOrder: e.sortOrder ?? i,
              })),
            },
          })),
        },
        reviews: {
          create: (trip.reviews ?? []).map((r) => ({ authorName: r.authorName, comment: r.comment })),
        },
      },
    });
    imported += 1;
    console.log(`+ ${trip.slug}`);
  }

  console.log(`\nImportuota: ${imported}, praleista (jau egzistavo): ${skipped}`);

  const testTrip = await prisma.trip.findUnique({ where: { slug: "test-kelione-roma" } });
  if (testTrip) {
    const departureIds = (
      await prisma.departure.findMany({ where: { tripId: testTrip.id }, select: { id: true } })
    ).map((d) => d.id);
    await prisma.seat.deleteMany({ where: { departureId: { in: departureIds } } });
    await prisma.cabinType.deleteMany({ where: { departureId: { in: departureIds } } });
    await prisma.extraOption.deleteMany({ where: { departureId: { in: departureIds } } });
    await prisma.departure.deleteMany({ where: { tripId: testTrip.id } });
    await prisma.review.deleteMany({ where: { tripId: testTrip.id } });
    await prisma.trip.delete({ where: { id: testTrip.id } });
    console.log("Pašalinta testinė kelionė test-kelione-roma.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
