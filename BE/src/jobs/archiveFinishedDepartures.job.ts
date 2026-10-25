import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

// Kasdien (vidurnaktį, žr. server.ts): pažymi ACTIVE Departure, kurios jau
// pasibaigė (date + durationDays < dabar), kaip DONE. Be šito niekas
// automatiškai nepažymi praėjusios kelionės kaip įvykusios — ji liktų
// "ACTIVE" (ir toliau matoma viešai) amžinai, kol admin rankiniu būdu
// nepakeistų. DONE kelionė automatiškai nebesirodo viešai, nes
// trip.service.ts visur filtruoja departures pagal status:"ACTIVE" —
// jokio papildomo FE/API pakeitimo nereikia. Pati Departure/Trip DB
// įraše lieka visam laikui (reikalinga užsakymų/apskaitos istorijai).
export async function archiveFinishedDepartures(): Promise<void> {
  const candidates = await prisma.departure.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, date: true, durationDays: true },
  });

  const now = Date.now();
  const finishedIds = candidates
    .filter((d) => d.date.getTime() + d.durationDays * 24 * 60 * 60 * 1000 < now)
    .map((d) => d.id);

  if (finishedIds.length === 0) return;

  const result = await prisma.departure.updateMany({
    where: { id: { in: finishedIds } },
    data: { status: "DONE" },
  });

  logger.info({ count: result.count, departureIds: finishedIds }, "Pasibaigusios Departure pažymėtos DONE");
}
