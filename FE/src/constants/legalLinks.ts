const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// infoForm/privacyPolicy/airCarriageConditions — realūs STATINIAI PDF failai,
// patalpinti BE/assets/documents/static/ (žr. BE's app.ts /documents static
// serving), atsisiunčiami Step 3 sutikimų languose. "Keliautojo atmintinė"
// NĖRA čia — ji DINAMIŠKAI generuojama per kelionę/išvykimą (žr.
// BuyTravellerInfo.tsx, BE travellerMemo.service.ts), ne statinis failas.
// tourismTerms/cookiePolicy — SAVO puslapiai (ne external/PDF). tourismTerms
// tekstas perkeltas iš senos prasmingas.lt svetainės (žr. pages/Terms/Terms.tsx);
// cookiePolicy – naujas puslapis, į kurį privatumo politikos PDF (6 ir 13 psl.)
// jau nurodo nuorodą https://www.prasmingas.lt/slapuku-politika/ (žr.
// pages/CookiePolicy/CookiePolicy.tsx).
export const LEGAL_LINKS = {
  infoForm: `${API_URL}/documents/standartine_informacijos_teikimo_formapdf.pdf`,
  privacyPolicy: `${API_URL}/documents/privatumo-politika.pdf`,
  airCarriageConditions: `${API_URL}/documents/vezimo-oru-salygos.pdf`,
  tourismTerms: "/organizuotos-turistines-keliones-salygos",
  cookiePolicy: "/slapuku-politika",
} as const;
