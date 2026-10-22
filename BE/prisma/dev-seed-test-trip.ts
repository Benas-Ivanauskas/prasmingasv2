// Laikinas skriptas vien tik Fazės 2 viešo endpoint'o rankiniam patikrinimui —
// ištrinamas po testo, NE dalis nuolatinio seed'o (žr. prisma/seed.ts).
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const trip = await prisma.trip.upsert({
    where: { slug: "test-kelione-roma" },
    update: {},
    create: {
      slug: "test-kelione-roma",
      title: "Testinė kelionė į Romą",
      shortDescription: "Trumpas testinis aprašymas",
      description: "Pilnas testinis aprašymas kelionės į Romą.",
      tripType: "BUS",
      category: "SIGHTSEEING",
      destinationCountry: "Italija",
      filterTags: ["uzsienyje"],
      invoiceName: "TEST",
      images: [{ url: "https://example.com/roma.jpg", alt: "Roma", sortOrder: 0 }],
      departures: {
        create: [
          {
            date: new Date("2026-06-15"),
            durationDays: 5,
            cost: 299.99,
            discount: 10,
            status: "ACTIVE",
            seats: {
              create: [
                { seatNumber: "1A", status: "FREE" },
                { seatNumber: "1B", status: "TAKEN" },
              ],
            },
            extraOptions: {
              create: [{ name: "Bagažas", price: 15, sortOrder: 0 }],
            },
          },
          {
            date: new Date("2025-01-01"),
            durationDays: 5,
            cost: 199.99,
            status: "ARCHIVED",
          },
        ],
      },
      reviews: {
        create: [{ authorName: "Jonas", comment: "Puiki kelionė!" }],
      },
    },
  });

  console.log("Test trip ready:", trip.slug);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
