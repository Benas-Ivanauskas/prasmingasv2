import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { renderHtmlToPdf } from "../lib/pdf.js";
import { escapeHtml, toRichHtml } from "../lib/richText.js";

interface ProgramDay {
  day: number;
  title?: string;
  description?: string;
}

// Plati print-stiliaus puslapio CSS — paprastas tekstas, paryškintos
// antraštės, standartinė mėlyna nuoroda. SĄMONINGAI be jokių <img> — PDF
// generavimas/siuntimas su nuotraukomis užtrunka ilgiau ir didina atmintinės
// dydį, vartotojo prašymu nenaudojama.
const PAGE_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: Georgia, "Times New Roman", "Noto Serif", serif;
    color: #1a1a1a;
    line-height: 1.55;
    font-size: 11pt;
  }
  h1 { font-size: 16pt; margin: 0 0 1.2rem; }
  h2 { font-size: 12.5pt; font-weight: 700; margin: 1.8rem 0 0.7rem; }
  section:first-of-type h2 { margin-top: 0; }
  p { margin: 0 0 0.9rem; }
  a { color: #1a4fb4; text-decoration: underline; }
  ul { margin: 0 0 0.9rem; padding-left: 1.3rem; }
  li { margin-bottom: 0.4rem; }
  .day-block { margin-bottom: 1.1rem; }
  .day-block:last-child { margin-bottom: 0; }
  .day-title { font-weight: 700; margin-bottom: 0.3rem; }
  .cost-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 2rem; }
`;

function buildProgramHtml(programDays: ProgramDay[]): string {
  if (programDays.length === 0) return "";
  const days = programDays
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(
      (d) => `
        <div class="day-block">
          <div class="day-title">${escapeHtml(String(d.day))} diena${d.title ? ": " + escapeHtml(d.title) : ""}</div>
          ${toRichHtml(d.description)}
        </div>
      `,
    )
    .join("");
  return `<section><h2>Kelionės programa</h2>${days}</section>`;
}

function buildMemoHtml(trip: {
  title: string;
  shortDescription: string;
  programDays: unknown;
  inclusions: unknown;
  exclusions: unknown;
  travellerMemo: string | null;
}): string {
  const programDays = Array.isArray(trip.programDays) ? (trip.programDays as ProgramDay[]) : [];
  const introHtml = toRichHtml(trip.shortDescription);
  const inclusionsHtml = toRichHtml(trip.inclusions);
  const exclusionsHtml = toRichHtml(trip.exclusions);
  const programHtml = buildProgramHtml(programDays);
  const memoHtml = trip.travellerMemo ?? "";

  return `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<style>${PAGE_STYLE}</style>
</head>
<body>
  <h1>${escapeHtml(trip.title)} — Atmintinė</h1>
  ${introHtml}
  ${programHtml}
  <section>
    <h2>Į kainą įskaičiuota / neįskaičiuota</h2>
    <div class="cost-grid">
      <div><p><strong>Įskaičiuota</strong></p>${inclusionsHtml}</div>
      <div><p><strong>Neįskaičiuota</strong></p>${exclusionsHtml}</div>
    </div>
  </section>
  ${memoHtml ? `<section>${memoHtml}</section>` : ""}
</body>
</html>`;
}

async function getTripOrThrow(tripSlug: string) {
  const trip = await prisma.trip.findUnique({ where: { slug: tripSlug } });
  if (!trip) {
    throw new ApiError(404, "Kelionė nerasta");
  }
  return trip;
}

// Viešas (be auth), be jokio DB įrašo/cache'o — generuojama kaskart iš
// naujo (greitas, nebrangus Puppeteer kvietimas), kad visada atspindėtų
// NAUJAUSIĄ admin'o redaguotą turinį, ne pasenusią versiją. Visas turinys
// (shortDescription/programDays/inclusions/exclusions/travellerMemo) yra
// TRIP, NE Departure lygio — tad TAS PATS dokumentas tinka abiem vietoms:
//
//   generateTripProgramPdf   — /trips/:slug puslapio "Atsisiųsti programą"
//                               mygtukas, be jokio konkretaus išvykimo.
//   generateTravellerMemoPdf — Step 3 ("Keleiviai") sutikimo langas,
//                               PAPILDOMAI patikrina departureId egzistuoja
//                               tam Trip'ui (apsauga nuo klaidingo URL),
//                               bet pats PDF turinys identiškas.
export async function generateTripProgramPdf(tripSlug: string): Promise<Buffer> {
  const trip = await getTripOrThrow(tripSlug);
  const html = buildMemoHtml(trip);
  return renderHtmlToPdf(html);
}

export async function generateTravellerMemoPdf(tripSlug: string, departureId: string): Promise<Buffer> {
  const trip = await getTripOrThrow(tripSlug);

  const departure = await prisma.departure.findFirst({ where: { id: departureId, tripId: trip.id } });
  if (!departure) {
    throw new ApiError(404, "Išvykimas nerastas");
  }

  const html = buildMemoHtml(trip);
  return renderHtmlToPdf(html);
}
