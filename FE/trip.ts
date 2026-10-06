import type { Trip, Seat, TripImage } from "./src/types/trip";
import { generateBusSeatLabels } from "./src/components/BuySession/busSeatLayout";

// Shared photo pool for the Latgalos kraštas trip — reused across several
// programDays (and 1:1 with trip.images, so everything shown in Programa is
// also in Apžvalga) instead of pulling in unrelated stock photos from other
// trips just for variety.
const LATGALA_PHOTOS = {
  dvaras: {
    url: "https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=800&q=80",
    alt: "Latgalos dvaras",
  },
  bazilika: {
    url: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=800&q=80",
    alt: "Agluonos bazilika",
  },
  tvirtove: {
    url: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80",
    alt: "Daugpilio tvirtovė",
  },
  kraslava: {
    url: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80",
    alt: "Kraslava",
  },
  valgiai: {
    url: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
    alt: "Latgalos valgių degustacija",
  },
  krastovaizdis: {
    url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    alt: "Latvijos kraštovaizdis",
  },
} satisfies Record<string, Omit<TripImage, "sortOrder">>;

function latgalaPhotos(...keys: (keyof typeof LATGALA_PHOTOS)[]): TripImage[] {
  return keys.map((key, sortOrder) => ({ ...LATGALA_PHOTOS[key], sortOrder }));
}

// Generates a bus seat list of any size, marking the given 1-based
// generation positions as TAKEN and the rest FREE. The actual row layout
// (2+2 with a jump seat on the final row for any remainder) is derived
// from the count alone by buildBusSeatMap() in
// src/components/BuySession/busSeatLayout.ts — no per-size logic needed
// here, matching whatever bus templates admins configure later — currently
// the standard sizes 53/52/49/48 are all used across these mock trips.
// Seat labels ("4C") come from that same module's row/letter scheme, not a
// flat count, so a seat's label always matches the row it renders in.
function makeBusSeats(prefix: string, totalSeats: number, takenSeatNumbers: number[] = []): Seat[] {
  const labels = generateBusSeatLabels(totalSeats);
  return Array.from({ length: totalSeats }, (_, i) => {
    const position = i + 1;
    return {
      id: `${prefix}-${position}`,
      seatNumber: labels[i],
      status: takenSeatNumbers.includes(position) ? ("TAKEN" as const) : ("FREE" as const),
    };
  });
}

export const mockTrips: Trip[] = [
  {
    id: "trip-latgala-bus-003",
    slug: "latgalos-krastas-agluona-daugpilis",
    title: "Latgalos kraštas: Agluona, Daugpilis, Kraslava ir Latgalos valgių degustacija",
    shortDescription: "Turininga 5 dienų kelionė po Latgalos regioną.",
    description:
      "Atraskite nuostabų Latgalos kraštą. Aplankysime didingą Agluonos baziliką, Daugpilio tvirtovę, Kraslavą bei mėgausimės tradiciniais Latgalos valgiais.",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "Latvija",
    badgeTag: "",
    filterTags: ["uzsienyje", "pazintines", "autobusu", "latvija"],
    invoiceName: "LAT",
    nextInvoiceNumber: 1,
    isActive: true,
    // Shared 1:1 with programDays[].images below — every photo that shows up
    // in Programa also lives here, so Apžvalga's gallery always has it too.
    images: latgalaPhotos("dvaras", "bazilika", "tvirtove", "kraslava", "valgiai", "krastovaizdis"),
    programDays: [
      {
        day: 1,
        title: "Kelionė į Latviją, Agluonos bazilika",
        description:
          "Ryte išvykstame iš Lietuvos – kelio pradžia Kaune, toliau renkame keliautojus Vilniuje, Ukmergėje ir Utenoje (visas išvykimo vietas ir laikus rasite Atmintinės skiltyje). Pasienį kirtę įvažiuojame į Latviją ir pirmiausia sustojame prie didingos Agluonos bazilikos – vienos svarbiausių piligrimystės vietų visame regione, dažnai vadinamos „Latvijos Lurdu“. Apžiūrėsime baziliką iš išorės, o norintieji galės užeiti ir į vidų. Vakare atvykstame į apgyvendinimo vietą ir įsikuriame viešbutyje nakvynei.",
        imageUrl: LATGALA_PHOTOS.dvaras.url,
        imageAlt: LATGALA_PHOTOS.dvaras.alt,
        images: latgalaPhotos("dvaras", "bazilika", "krastovaizdis"),
      },
      {
        day: 2,
        title: "Daugpilio tvirtovė ir Olgos Gribulės lėlių kolekcija",
        description:
          "Antrąją dieną skiriame Daugpiliui. Aplankysime Daugpilio tvirtovę – vieną geriausiai išlikusių XIX amžiaus gynybinių kompleksų visose Baltijos šalyse (ekskursija ir bilietas: suaugusiems ~3,60 €/asm.; moksleiviams, studentams ir senjorams ~1,8 €/asm., neįskaičiuota į kelionės kainą). Po pietų – savita Olgos Gribulės lėlių kolekcija, kurioje pamatysite šimtus rankų darbo lėlių (bilietas ~4 €/asm.). Dienos pabaigoje turėsite laisvo laiko pasivaikščioti mieste savarankiškai.",
        imageUrl: LATGALA_PHOTOS.tvirtove.url,
        imageAlt: LATGALA_PHOTOS.tvirtove.alt,
        images: latgalaPhotos("tvirtove", "dvaras", "kraslava", "bazilika", "krastovaizdis"),
      },
      {
        day: 3,
        title: "Pliaterių pilies kompleksas ir Kraslava",
        description:
          "Trečią dieną vyksime į Pliaterių pilies kompleksą – vieną puošniausių dvarų visoje Latgaloje (ekskursija ~2 €/asm., neįskaičiuota į kelionės kainą). Po apsilankymo keliausime į Kraslavą – jaukų miestelį prie Dauguvos upės, pagarsėjusį gražia architektūra ir ramia pakrante. Pasivaikščiosime senamiestyje, o laisvo laiko turėsite ir fotografijoms prie upės.",
        imageUrl: LATGALA_PHOTOS.kraslava.url,
        imageAlt: LATGALA_PHOTOS.kraslava.alt,
        images: latgalaPhotos("kraslava", "krastovaizdis", "tvirtove"),
      },
      {
        day: 4,
        title: "Latgalos valgių degustacija, laisvas laikas",
        description:
          "Ketvirtoji diena skirta Latgalos virtuvės pažinimui – vietinėje kavinėje lauks tradicinių Latgalos valgių degustacija (~10 €/asm., neįskaičiuota į kelionės kainą), kurios metu paragausite regionui būdingų patiekalų. Likusią dienos dalį skiriame laisvam laikui – galėsite savarankiškai pasivaikščioti, apsipirkti ar tiesiog pailsėti prieš grįžimo kelionę.",
        imageUrl: LATGALA_PHOTOS.valgiai.url,
        imageAlt: LATGALA_PHOTOS.valgiai.alt,
        images: latgalaPhotos("valgiai", "bazilika"),
      },
      {
        day: 5,
        title: "Grįžimas į Lietuvą",
        description:
          "Paskutinę kelionės dieną leidžiamės į kelią namo. Grįžtant sustosime keliose pakeliui esančiose vietose, o į Lietuvą planuojame grįžti vakare – tikslus laikas priklauso nuo pasirinkto išvykimo taško (žr. Atmintinės skiltį „Išvykimo vietos ir laikas“).",
        imageUrl: LATGALA_PHOTOS.krastovaizdis.url,
        imageAlt: LATGALA_PHOTOS.krastovaizdis.alt,
        images: latgalaPhotos("krastovaizdis", "dvaras", "kraslava"),
      },
    ],
    inclusions: [
      "Kelionė autobusu",
      "Kelionės vadovo paslaugos",
      "Latgalos valgių degustacija",
      "Ekskursijos pagal programą",
      "Nakvynės (4 naktys 3★ viešbučiuose)",
    ],
    exclusions: ["Asmeninės išlaidos", "Pietūs", "Įėjimo bilietai į objektus"],
    travellerMemo: `Į KAINĄ ĮSKAIČIUOTA

• Kelionė turistinės klasės autobusu

• Ekskursinė programa

• Kelionės vadovo paslaugos (lietuvių k.)

• Nakvynės (4 naktys 3★ viešbučiuose, dvivietiai/trivietiai numeriai)

Į KAINĄ NEĮSKAIČIUOTA

• Pliaterių pilies kompleksas:

- Ekskursija ~2 €/asm.

• Latgalos valgių degustacija ~10 €/asm.

• Olgos Gribulės lėlių kolekcija:

- bilietas ~4 €/asm.

• Daugpilio tvirtovė:

- Ekskursija ir bilietas: suaugusiems ~3,60 €/asm.; moksleiviams, studentams ir senjorams ~1,8 €/asm.

• Bažnyčios lankymas – laisva auka

• Perkant bilietą su nuolaida būtinas pažymėjimas

• Asmeninės išlaidos

• Medicininių išlaidų draudimas

IŠVYKIMO VIETOS IR LAIKAS

Pažintinė 5 dienų kelionė į Latviją autobusu iš Kauno per Vilnių, Ukmergę ir Uteną.

Prašome atvykti 10 min. iki autobuso išvykimo.

Išvykimo laikas gali būti tikslinamas 1-2 d. prieš kelionės pradžią.

Kaunas - prie MCDONALD‘S, Savanorių pr. 321 (šalia yra automobilių stovėjimo aikštelė, savaitgaliais nemokama); išvykimas 05:15, planuojamas grįžimas 5-ą kelionės dieną tarp 22:30 ir 23:30

Vilnius

• Gariūnai, sustojimas link Vilniaus centro; išvykimas ~06:25

• ERGO stovėjimo aikštelė, Geležinio Vilko g. 6A, prie Gerosios Vilties žiedo; išvykimas ~06:30, planuojamas grįžimas 5-ą kelionės dieną tarp 21:00 ir 22:00

Rumšiškės - sustojimas link Vilniaus; išvykimas ~05:30

Žiežmariai - sustojimas link Vilniaus; išvykimas ~05:45

Elektrėnai - degalinė CIRCLE K, prie autostrados, link Vilniaus; išvykimas ~05:55

Vievis - sustojimas link Vilniaus; išvykimas ~06:05

Grigiškės - degalinė VIADA, prie autostrados, Kovo 11-osios g. 75, Grigiškės; išvykimas ~06:20

Ukmergė - aikštelė prie PC EIFELIS; išvykimas ~07:35

Utena - Circle K Utena, J. Basanavičiaus g. 108a; išvykimas ~08:35

KITOS PASTABOS

• Kelionei BŪTINAS galiojantis asmens dokumentas – asmens tapatybės kortelė arba pasas. Jų galiojimo laikas turi būti ne trumpesnis nei 3 mėn. kelionei pasibaigus

• Turėti Europos sveikatos draudimo kortelę (išduoda ligonių kasos)

• Vykstantiems į kelionę, rekomenduojame (neprivaloma) turėti papildomą medicininių išlaidų draudimą, garantuojantį būtinosios medicinos pagalbos užsienyje ir papildomų išlaidų, susidariusių dėl draudiminio įvykio, apmokėjimą.

Tokį draudimą galite įsigyti internetu draudimo bendrovėse, bankuose... Vienas iš jų: https://www.draudimas.lt/kelioniu-draudimas

• Informaciją atsiųsime trumpąja SMS žinute jūsų nurodytu telefono numeriu:

- kad susirinko grupė – 3-4 d. iki kelionės pradžios

- autobuso valstybinį numerį ir sėdimas vietas – 1-2 d. iki kelionės pradžios
- užsakant kelionę pasirenkama pageidaujama preliminari vieta autobuse, kuri gali keistis; apie tikslią vietą autobuse būsite informuoti SMS žinute
• Į keliones vykstame turistinės klasės autobusais arba mikroautobusais. Transporto priemonė parenkama atsižvelgiant į keleivių skaičių. Kelionių organizatorius neįsipareigoja iš anksto informuoti keleivių apie kelionei pasirinktą transporto priemonę

• Kelionės vadovas autobuse veda programą ir supažindina su lankomais objektais

• Kelionės vadovas muziejuose ir kituose mokamuose objektuose ekskursijų neveda

• Lankomų objektų skaičius, eiliškumas ir kainos gali kisti

• Vietinių švenčių metu kai kurie programoje numatyti lankomi objektai gali būti uždaryti

• Pagal galiojančias ES taisykles keleivių saugumo sumetimais:

- autobuse draudžiama rūkyti, vartoti alkoholinius gėrimus, narkotines medžiagas

- autobusui judant salone draudžiama stovėti, vaikščioti

- autobusuose, kuriuose įrengti saugos diržai, keleiviai privalo važiuoti juos prisisegę

- autobusui judant salone draudžiama gerti karštus gėrimus

• Turėkite atsigerti, kepurę, skėtį, lietpaltį, šiltus rūbus... (pagal orų prognozes)

• Keliaujant rugsėjo-balandžio mėn., rekomenduojame turėti atšvaitus dėl jūsų saugumo

• Ši kelionė nėra pritaikyta riboto judumo asmenims

• Pageidaujant vienvietio numerio – taikoma priemoka (sąlygas tikslinkitės registracijos metu)

ORGANIZUOTOS TURISTINĖS KELIONĖS SUTARTIES SĄLYGOS

Prieš pirkdami bilietą būtinai susipažinkite su sutarties sąlygomis. Jas rasite >>> čia

REGISTRACIJA IR APMOKĖJIMAS

Spauskite mygtuką "Pirkti bilietą" ir, užpildę reikiamus duomenis, apmokėkite elektroninės bankininkystė pagalba.

Jei neturite elektroninės bankininkystės, skambinkite

tel. +370 659 55770 dėl galimybės apmokėti bankiniu pavedimu arba per "Perlą".

Registracija patvirtinama įsigijus bilietą.

..........................................................

Kelionę organizuoja: VšĮ "Prasmingam gyvenimui"

Kelionių organizatoriaus pažymėjimo Nr. 17231

Prievolių užtikrinimo draudimas Nr. 710-741-101069, ERGO Insurance SE Lietuvos filialas`,
    departures: [
      {
        id: "departure-latgala-2026-09-26",
        date: "2026-09-26T00:00:00.000Z",
        time: "06:30",
        // Matches travellerMemo's "IŠVYKIMO VIETOS IR LAIKAS" section verbatim —
        // the two Vilnius stops are named distinctly since pickup-point
        // selection elsewhere keys off `city`.
        pickupPoints: [
          { city: "Kaunas", time: "05:15" },
          { city: "Rumšiškės", time: "05:30" },
          { city: "Žiežmariai", time: "05:45" },
          { city: "Elektrėnai", time: "05:55" },
          { city: "Vievis", time: "06:05" },
          { city: "Grigiškės", time: "06:20" },
          { city: "Vilnius (Gariūnai)", time: "06:25" },
          { city: "Vilnius (ERGO)", time: "06:30" },
          { city: "Ukmergė", time: "07:35" },
          { city: "Utena", time: "08:35" },
        ],
        durationDays: 5,
        cost: 289,
        discount: 10,
        guaranteeThreshold: 50,
        guaranteedOverride: true,
        remainingPaymentDays: 1,
        status: "ACTIVE",
        seats: makeBusSeats(
          "s-lat-1",
          48,
          Array.from({ length: 48 }, (_, i) => i + 1)
        ),
        extraOptions: [
          {
            id: "extra-latgala-lunch",
            name: "Pietūs Latgalos krašto kavinėje",
            price: 12,
            sortOrder: 0,
          },
          {
            id: "extra-latgala-entry",
            name: "Įėjimo bilietas į Daugpilio tvirtovės ekspoziciją",
            price: 8,
            sortOrder: 1,
          },
        ],
      },
      {
        id: "departure-latgala-2026-10-17",
        date: "2026-10-17T00:00:00.000Z",
        time: "06:30",
        pickupPoints: [
          { city: "Kaunas", time: "05:15" },
          { city: "Rumšiškės", time: "05:30" },
          { city: "Žiežmariai", time: "05:45" },
          { city: "Elektrėnai", time: "05:55" },
          { city: "Vievis", time: "06:05" },
          { city: "Grigiškės", time: "06:20" },
          { city: "Vilnius (Gariūnai)", time: "06:25" },
          { city: "Vilnius (ERGO)", time: "06:30" },
          { city: "Ukmergė", time: "07:35" },
          { city: "Utena", time: "08:35" },
        ],
        durationDays: 5,
        cost: 289,
        discount: 15,
        guaranteeThreshold: 70,
        guaranteedOverride: false,
        remainingPaymentDays: 5,
        status: "ACTIVE",
        seats: makeBusSeats("s-lat-2", 53),
        extraOptions: [
          {
            id: "extra-latgala-lunch-2",
            name: "Pietūs Latgalos krašto kavinėje",
            price: 12,
            sortOrder: 0,
          },
          {
            id: "extra-latgala-entry-2",
            name: "Įėjimo bilietas į Daugpilio tvirtovės ekspoziciją",
            price: 8,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
  {
    id: "trip-siauliai-theatre-001",
    slug: "top-siauliai-teatro-uzkulisiai",
    title: "TOP Šiauliai: Teatro užkulisiai, šokolado dirbtuvės ir spektaklis - detektyvas",
    shortDescription: "Ekskursija į Šiaulius, teatro užkulisiai ir saldžios šokolado dirbtuvės.",
    description:
      "Kelionė į Šiaulius. Aplankysime Valstybinį Šiaulių dramos teatrą, saldžias šokolado dirbtuves ir pamatysime intriguojantį spektaklį-detektyvą.",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "Lietuva",
    badgeTag: "Paskutinė minutė!",
    filterTags: ["lietuva", "pazintines", "autobusu", "savaitgaliui"],
    invoiceName: "SIA",
    nextInvoiceNumber: 1,
    isActive: true,
    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
      alt: "Šiaulių dramos teatras",
      sortOrder: i,
    })),
    programDays: [
      {
        day: 1,
        title: "Šiauliai ir teatras",
        description: "Išvykimas, teatro užkulisiai, šokolado gamyba ir spektaklis.",
        imageUrl:
          "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Šiaulių dramos teatras",
      },
    ],
    inclusions: ["Kelionė autobusu", "Kelionės vadovo paslaugos", "Teatro bilietas"],
    exclusions: ["Asmeninės išlaidos", "Pietūs"],
    departures: [
      {
        id: "departure-siauliai-2026-10-03",
        date: "2026-10-03T00:00:00.000Z",
        time: "07:00",
        pickupPoints: [
          { city: "Vilnius", time: "07:00" },
          { city: "Kaunas", time: "08:15" },
        ],
        durationDays: 1,
        cost: 67,
        discount: 20,
        guaranteeThreshold: 50,
        guaranteedOverride: true,
        remainingPaymentDays: 2,
        status: "ACTIVE",
        seats: makeBusSeats("s-siauliai", 52, [3, 4, 17]),
        extraOptions: [
          {
            id: "extra-siauliai-lunch",
            name: "Pietūs kavinėje \"Rūtos\" šokolado muziejuje",
            price: 0,
            sortOrder: 0,
          },
          {
            id: "extra-siauliai-ticket",
            name: "Papildomas bilietas į spektaklį",
            price: 20,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
  {
    id: "trip-miltinis-bistrampolis-002",
    slug: "spektaklis-miltinio-dramos-teatre-bistrampolio-dvaras",
    title: "Spektaklis J.Miltinio dramos teatre, gardūs desertai ir Bistrampolio dvaro istorijos",
    shortDescription: "Turiningas sekmadienis su spektakliu ir Bistrampolio dvaro istorijomis.",
    description:
      "Vykstame į Panevėžį, garsųjį J.Miltinio dramos teatrą. Po spektaklio lepinsimės desertais ir lankysimės didingame Bistrampolio dvare.",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "Lietuva",
    badgeTag: "Paskutinė minutė! Sekmadienis",
    filterTags: ["lietuva", "pazintines", "autobusu", "savaitgaliui"],
    invoiceName: "MIL",
    nextInvoiceNumber: 1,
    isActive: true,
    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80",
      alt: "Bistrampolio dvaras",
      sortOrder: i,
    })),
    programDays: [
      {
        day: 1,
        title: "Panevėžys ir Bistrampolis",
        description: "Kelionė autobusu, spektaklis, dvaro ekskursija.",
        imageUrl:
          "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Bistrampolio dvaras",
      },
    ],
    inclusions: ["Kelionė autobusu", "Teatro bilietas", "Dvaro lankymas"],
    exclusions: ["Asmeninės išlaidos"],
    departures: [
      {
        id: "departure-bistrampolis-2026-10-04",
        date: "2026-10-04T00:00:00.000Z",
        time: "07:30",
        pickupPoints: [
          { city: "Vilnius", time: "07:30" },
          { city: "Kaunas", time: "08:45" },
        ],
        durationDays: 1,
        cost: 67,
        discount: 20,
        guaranteeThreshold: 50,
        guaranteedOverride: true,
        remainingPaymentDays: 3,
        status: "ACTIVE",
        seats: makeBusSeats("s-bistrampolis", 49, [3, 4, 15, 16, 27]),
        extraOptions: [
          {
            id: "extra-bistrampolis-audio",
            name: "Gidas su ausinėmis Bistrampolio dvare",
            price: 5,
            sortOrder: 0,
          },
          {
            id: "extra-bistrampolis-dessert",
            name: "Papildomas deserto rinkinys",
            price: 6,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
  {
    id: "trip-italy-bus-001",
    slug: "italija-gardos-ezeras-verona",
    title: "Italija: Gardos ežeras ir Verona",
    shortDescription: "Pažintinė kelionė autobusu po Šiaurės Italiją.",
    description:
      "Kelionė po vieną gražiausių Italijos regionų. Aplankysime Veroną, Gardos ežerą ir Sirmionę.",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "Italija",
    filterTags: ["uzsienyje", "pazintines", "autobusu", "italija"],
    invoiceName: "ITA",
    nextInvoiceNumber: 1,
    isActive: true,

    images: Array.from({ length: 8 }, (_, i) =>
      i % 2 === 0
        ? {
            url: "https://images.unsplash.com/photo-1529260830199-42c24126f198",
            alt: "Verona, Italija",
            sortOrder: i,
          }
        : {
            url: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
            alt: "Gardos ežeras",
            sortOrder: i,
          }
    ),

    programDays: [
      {
        day: 1,
        title: "Kelionė į Italiją",
        description: "Išvykimas iš Lietuvos ir kelionė autobusu.",
        imageUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198",
        imageAlt: "Verona, Italija",
      },
      {
        day: 2,
        title: "Verona",
        description: "Pažintis su Verona ir miesto senamiesčiu.",
        imageUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198",
        imageAlt: "Verona, Italija",
      },
      {
        day: 3,
        title: "Gardos ežeras",
        description: "Sirmionė ir Gardos ežero pakrantė.",
        imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
        imageAlt: "Gardos ežeras",
      },
      {
        day: 4,
        title: "Kelionė namo",
        description: "Kelionė autobusu į Lietuvą.",
        imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
        imageAlt: "Gardos ežeras",
      },
    ],

    inclusions: [
      "Kelionė autobusu",
      "Kelionės vadovo paslaugos",
      "Ekskursinė programa",
    ],

    exclusions: ["Maitinimas", "Asmeninės išlaidos", "Muziejų bilietai"],

    seoTitle: "Kelionė autobusu į Italiją",
    seoDescription: "Pažintinė kelionė po Veroną ir Gardos ežerą.",

    departures: [
      {
        id: "departure-italy-2027-05-12",
        date: "2027-05-12T00:00:00.000Z",
        time: null,

        pickupPoints: [
          {
            city: "Vilnius",
            time: "06:00",
          },
          {
            city: "Kaunas",
            time: "07:30",
          },
        ],

        durationDays: 4,
        cost: 499,
        discount: null,

        guaranteeThreshold: 70,
        guaranteedOverride: false,

        remainingPaymentDays: 5,
        status: "ACTIVE",

        flightSeatsTotal: null,
        flightSeatsTaken: 0,

        seats: makeBusSeats("s-italy-1", 48, [5, 6, 19]),

        cabinTypes: [],

        extraOptions: [
          {
            id: "extra-italy-1",
            name: "Papildomas bagažas",
            price: 35,
            sortOrder: 0,
          },
        ],
      },
      {
        id: "departure-italy-2027-06-15",
        date: "2027-06-15T00:00:00.000Z",
        time: null,
        pickupPoints: [
          { city: "Vilnius", time: "06:00" },
          { city: "Kaunas", time: "07:30" },
        ],
        durationDays: 4,
        cost: 499,
        discount: 10,
        guaranteeThreshold: 70,
        guaranteedOverride: true,
        remainingPaymentDays: 10,
        status: "ACTIVE",
        seats: makeBusSeats("s-italy-2", 53, [11]),
      },
    ],
  },

  // ─────────────────────────────────────
  // BUS
  // ─────────────────────────────────────

  {
    id: "trip-prague-bus-001",
    slug: "cekija-praha",
    title: "Čekija: Praha ir Karlovy Varai",
    shortDescription: "Pažintinė kelionė autobusu į Čekiją.",
    description:
      "Kelionė į Prahą ir Karlovy Varus. Architektūra, istorija ir jaukūs Čekijos miestai.",
    tripType: "BUS",
    category: "SIGHTSEEING",
    destinationCountry: "Čekija",
    filterTags: ["uzsienyje", "pazintines", "autobusu", "cekija"],
    invoiceName: "CZE",
    nextInvoiceNumber: 1,
    isActive: true,

    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7",
      alt: "Praha",
      sortOrder: i,
    })),

    programDays: [
      {
        day: 1,
        title: "Kelionė į Prahą",
        description: "Išvykimas iš Lietuvos.",
        imageUrl: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7",
        imageAlt: "Praha",
      },
      {
        day: 2,
        title: "Praha",
        description: "Ekskursija po Prahos senamiestį.",
        imageUrl: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7",
        imageAlt: "Praha",
      },
      {
        day: 3,
        title: "Karlovy Varai",
        description: "Pažintis su garsiuoju kurortiniu miestu.",
        imageUrl: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7",
        imageAlt: "Praha",
      },
      {
        day: 4,
        title: "Grįžimas",
        description: "Kelionė autobusu į Lietuvą.",
        imageUrl: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7",
        imageAlt: "Praha",
      },
    ],

    inclusions: ["Kelionė autobusu", "Kelionės vadovas", "Ekskursinė programa"],

    exclusions: ["Maitinimas", "Muziejų bilietai"],

    seoTitle: "Kelionė autobusu į Prahą",
    seoDescription: "Pažintinė kelionė į Prahą ir Karlovy Varus.",

    departures: [
      {
        id: "departure-prague-2027-04-17",
        date: "2027-04-17T00:00:00.000Z",
        time: null,

        pickupPoints: [
          {
            city: "Vilnius",
            time: "05:30",
          },
          {
            city: "Kaunas",
            time: "07:00",
          },
        ],

        durationDays: 4,
        cost: 329,
        discount: 10,

        guaranteeThreshold: 60,
        guaranteedOverride: false,

        remainingPaymentDays: 5,
        status: "ACTIVE",

        flightSeatsTotal: null,
        flightSeatsTaken: 0,

        seats: makeBusSeats("s-prague", 52, [9, 10, 21, 22, 23]),

        cabinTypes: [],
        extraOptions: [
          {
            id: "extra-prague-lunch",
            name: "Pietūs Prahos senamiestyje",
            price: 15,
            sortOrder: 0,
          },
          {
            id: "extra-prague-museum",
            name: "Įėjimo bilietas į Karlovy Varų muziejų",
            price: 10,
            sortOrder: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // FLIGHT
  // ─────────────────────────────────────

  {
    id: "trip-barcelona-flight-001",
    slug: "barselona-lektuvu",
    title: "Ispanija: Barselona",
    shortDescription: "Pažintinė kelionė lėktuvu į Barseloną.",
    description:
      "Pažintinė kelionė į Barseloną, Gaudi architektūrą ir Viduržemio jūros pakrantę.",
    tripType: "FLIGHT",
    category: "SIGHTSEEING",
    destinationCountry: "Ispanija",
    filterTags: ["uzsienyje", "pazintines", "lektuvu", "ispanija"],
    invoiceName: "ESP",
    nextInvoiceNumber: 1,
    isActive: true,

    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
      alt: "Barselona",
      sortOrder: i,
    })),

    programDays: [
      {
        day: 1,
        title: "Atvykimas į Barseloną",
        description: "Skrydis ir įsikūrimas viešbutyje.",
        imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
        imageAlt: "Barselona",
      },
      {
        day: 2,
        title: "Barselonos senamiestis",
        description: "Ekskursija po miesto centrą.",
        imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
        imageAlt: "Barselona",
      },
      {
        day: 3,
        title: "Gaudi architektūra",
        description: "Sagrada Familia ir Park Güell.",
        imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
        imageAlt: "Barselona",
      },
      {
        day: 4,
        title: "Laisva diena",
        description: "Laikas savarankiškam miesto pažinimui.",
        imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
        imageAlt: "Barselona",
      },
      {
        day: 5,
        title: "Grįžimas",
        description: "Skrydis į Lietuvą.",
        imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4",
        imageAlt: "Barselona",
      },
    ],

    inclusions: ["Skrydžiai", "Pervežimai", "Kelionės vadovo paslaugos"],

    exclusions: ["Maitinimas", "Muziejų bilietai"],

    seoTitle: "Kelionė lėktuvu į Barseloną",
    seoDescription: "Pažintinė kelionė lėktuvu į Barseloną.",

    departures: [
      {
        id: "departure-barcelona-2027-06-08",
        date: "2027-06-08T00:00:00.000Z",
        time: "09:20",

        pickupPoints: [],

        durationDays: 5,
        cost: 699,
        discount: null,

        guaranteeThreshold: 80,
        guaranteedOverride: false,

        remainingPaymentDays: 7,
        status: "ACTIVE",

        flightSeatsTotal: 40,
        flightSeatsTaken: 17,

        seats: [],
        cabinTypes: [],

        extraOptions: [
          {
            id: "extra-barcelona-1",
            name: "Registruotas bagažas",
            price: 55,
            sortOrder: 0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // CRUISE
  // ─────────────────────────────────────

  {
    id: "trip-mediterranean-cruise-001",
    slug: "vidurzemio-juros-kruizas",
    title: "Viduržemio jūros kruizas",
    shortDescription: "Poilsinė kelionė kruizu po Viduržemio jūrą.",
    description:
      "Kruizas po Viduržemio jūrą su sustojimais Italijoje, Prancūzijoje ir Ispanijoje.",
    tripType: "CRUISE",
    category: "LEISURE",
    destinationCountry: "Italija",
    filterTags: ["uzsienyje", "poilsines", "kruizines", "vidurzemio-jura"],
    invoiceName: "CRU",
    nextInvoiceNumber: 1,
    isActive: true,

    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
      alt: "Kruizinis laivas",
      sortOrder: i,
    })),

    programDays: [
      {
        day: 1,
        title: "Genuja",
        description: "Įlaipinimas į kruizinį laivą.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        imageAlt: "Kruizinis laivas",
      },
      {
        day: 2,
        title: "Marselis",
        description: "Diena Prancūzijos pakrantėje.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        imageAlt: "Kruizinis laivas",
      },
      {
        day: 3,
        title: "Barselona",
        description: "Laisvas laikas Barselonoje.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        imageAlt: "Kruizinis laivas",
      },
      {
        day: 4,
        title: "Jūra",
        description: "Poilsio diena laive.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        imageAlt: "Kruizinis laivas",
      },
      {
        day: 5,
        title: "Genuja",
        description: "Kruizo pabaiga.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        imageAlt: "Kruizinis laivas",
      },
    ],

    inclusions: [
      "Apgyvendinimas kajutėje",
      "Maitinimas laive",
      "Pramogos laive",
    ],

    exclusions: ["Gėrimai", "Ekskursijos krante", "Kelionė iki uosto"],

    seoTitle: "Viduržemio jūros kruizas",
    seoDescription: "Poilsinė kelionė kruizu po Viduržemio jūrą.",

    departures: [
      {
        id: "departure-cruise-2027-07-15",
        date: "2027-07-15T00:00:00.000Z",
        time: null,

        pickupPoints: [],

        durationDays: 5,
        cost: 899,
        discount: null,

        guaranteeThreshold: 70,
        guaranteedOverride: true,

        remainingPaymentDays: 10,
        status: "ACTIVE",

        flightSeatsTotal: null,
        flightSeatsTaken: 0,

        // Bus seats for the port-transfer coach, not the ship itself.
        seats: makeBusSeats("s-cruise-med", 49, [2, 3, 4, 14, 15, 22]),

        cabinTypes: [
          {
            id: "cabin-cruise-quad",
            type: "QUAD",
            pricePerPerson: 899,
            totalUnits: 10,
            takenUnits: 3,
          },
          {
            id: "cabin-cruise-double",
            type: "DOUBLE",
            pricePerPerson: 1099,
            totalUnits: 20,
            takenUnits: 11,
          },
          {
            id: "cabin-cruise-triple",
            type: "TRIPLE",
            pricePerPerson: 999,
            totalUnits: 10,
            takenUnits: 4,
          },
        ],

        extraOptions: [
          {
            id: "extra-cruise-1",
            name: "Wi-Fi paketas",
            price: 45,
            sortOrder: 0,
          },
          {
            id: "extra-cruise-2",
            name: "Gėrimų paketas",
            price: 120,
            sortOrder: 1,
          },
        ],
      },
    ],
  },

  {
    id: "trip-norway-cruise-001",
    slug: "norvegijos-fiordai",
    title: "Norvegijos fiordai",
    shortDescription: "Pažintinė kelionė kruizu po Norvegijos fiordus.",
    description:
      "Kelionė kruizu po įspūdingus Norvegijos fiordus, kalnus ir jaukius uostamiesčius.",
    tripType: "CRUISE",
    category: "SIGHTSEEING",
    destinationCountry: "Norvegija",
    filterTags: [
      "uzsienyje",
      "pazintines",
      "kruizines",
      "norvegija",
      "fiordai",
    ],
    invoiceName: "NOR",
    nextInvoiceNumber: 1,
    isActive: true,

    images: Array.from({ length: 8 }, (_, i) => ({
      url: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
      alt: "Norvegijos fiordai",
      sortOrder: i,
    })),

    programDays: [
      {
        day: 1,
        title: "Bergenas",
        description: "Atvykimas ir įlaipinimas.",
        imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        imageAlt: "Norvegijos fiordai",
      },
      {
        day: 2,
        title: "Geirangeris",
        description: "Norvegijos fiordų panorama.",
        imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        imageAlt: "Norvegijos fiordai",
      },
      {
        day: 3,
        title: "Flåm",
        description: "Pažintis su Flåm regionu.",
        imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        imageAlt: "Norvegijos fiordai",
      },
      {
        day: 4,
        title: "Stavangeris",
        description: "Laisvas laikas mieste.",
        imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        imageAlt: "Norvegijos fiordai",
      },
      {
        day: 5,
        title: "Bergenas",
        description: "Kruizo pabaiga.",
        imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        imageAlt: "Norvegijos fiordai",
      },
    ],

    inclusions: [
      "Apgyvendinimas kajutėje",
      "Maitinimas laive",
      "Kelionės programa",
    ],

    exclusions: ["Ekskursijos krante", "Asmeninės išlaidos"],

    seoTitle: "Norvegijos fiordai kruizu",
    seoDescription: "Pažintinė kelionė kruizu po Norvegijos fiordus.",

    departures: [
      {
        id: "departure-norway-2027-08-21",
        date: "2027-08-21T00:00:00.000Z",
        time: null,

        pickupPoints: [],

        durationDays: 5,
        cost: 1199,
        discount: 5,

        guaranteeThreshold: 75,
        guaranteedOverride: false,

        remainingPaymentDays: 10,
        status: "ACTIVE",

        flightSeatsTotal: null,
        flightSeatsTaken: 0,

        // Bus seats for the port-transfer coach, not the ship itself.
        seats: makeBusSeats("s-cruise-norway", 48, [1, 8, 9, 20]),

        cabinTypes: [
          {
            id: "cabin-norway-double",
            type: "DOUBLE",
            pricePerPerson: 1199,
            totalUnits: 15,
            takenUnits: 5,
          },
          {
            id: "cabin-norway-triple",
            type: "TRIPLE",
            pricePerPerson: 1099,
            totalUnits: 8,
            takenUnits: 3,
          },
        ],

        extraOptions: [
          {
            id: "extra-norway-1",
            name: "Wi-Fi paketas",
            price: 50,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
];
