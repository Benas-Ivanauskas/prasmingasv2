// Vienkartinis duomenų konversijos skriptas: Departure.guaranteeThreshold
// reikšmė anksčiau buvo PROCENTAS (0-100, "nuo kiek % užpildymo laikoma
// garantuota"), o nuo šio pakeitimo (žr. FE/src/utils/tripHelpers.ts::
// getTripAvailability) ji interpretuojama kaip TIESIOGINIS ŽMONIŲ SKAIČIUS
// — pats stulpelis (ir jo tipas) nesikeičia, tik reikšmės prasmė. Šis
// skriptas perskaičiuoja kiekvienos išvykos JAU NUSTATYTĄ (ne null) senąją
// % reikšmę į atitinkamą žmonių skaičių pagal tos konkrečios išvykos
// realią talpą (BUS/CRUISE — seats.length; FLIGHT — flightSeatsTotal;
// CRUISE kajutės — cabinTypes totalUnits*unitSize), kad "Garantuotas
// išvykimas" ženkliukas toliau rodytųsi TAIP PAT, kaip rodėsi prieš šį
// pakeitimą.
//
// NEPALEISK DAUGIAU NEI VIENĄ KARTĄ — tai NE idempotentiškas skriptas
// (antras paleidimas vėl konvertuotų jau konvertuotą žmonių skaičių taip,
// lyg tai būtų procentas, sugadindamas reikšmę). Paleidimas:
// `npx tsx prisma/convert-guarantee-threshold.ts`.
import { prisma } from "../src/lib/prisma.js";
import { getCabinUnitSize } from "../src/services/orderPricing.service.js";

async function main() {
  const departures = await prisma.departure.findMany({
    where: { guaranteeThreshold: { not: null } },
    select: {
      id: true,
      guaranteeThreshold: true,
      flightSeatsTotal: true,
      seats: { select: { id: true } },
      cabinTypes: { select: { type: true, totalUnits: true } },
      trip: { select: { title: true } },
    },
  });

  if (departures.length === 0) {
    console.log("Nėra nei vienos išvykos su nustatytu guaranteeThreshold — nieko konvertuoti.");
    return;
  }

  let converted = 0;
  let skipped = 0;

  for (const dep of departures) {
    const oldPercent = dep.guaranteeThreshold!;

    let totalSeats = 0;
    if (dep.seats.length > 0) {
      totalSeats = dep.seats.length;
    } else if (dep.flightSeatsTotal != null) {
      totalSeats = dep.flightSeatsTotal;
    } else if (dep.cabinTypes.length > 0) {
      totalSeats = dep.cabinTypes.reduce((acc, c) => acc + c.totalUnits * getCabinUnitSize(c.type), 0);
    }

    if (totalSeats <= 0) {
      console.log(`PRALEISTA (${dep.trip.title}, ${dep.id}) — nerasta talpos, ${oldPercent}% liktų nepakeista.`);
      skipped += 1;
      continue;
    }

    const newHeadcount = Math.round((totalSeats * oldPercent) / 100);
    await prisma.departure.update({ where: { id: dep.id }, data: { guaranteeThreshold: newHeadcount } });
    console.log(
      `${dep.trip.title} (${dep.id}): ${oldPercent}% iš ${totalSeats} → ${newHeadcount} žmonių`,
    );
    converted += 1;
  }

  console.log(`\nKonvertuota: ${converted}, praleista: ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
