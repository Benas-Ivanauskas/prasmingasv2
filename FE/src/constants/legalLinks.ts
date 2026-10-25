const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// infoForm/privacyPolicy/airCarriageConditions — realūs STATINIAI PDF failai,
// patalpinti BE/assets/documents/static/ (žr. BE's app.ts /documents static
// serving), atsisiunčiami Step 3 sutikimų languose. tourismTerms lieka senoje
// svetainėje — tam PDF dar nepateiktas. "Keliautojo atmintinė" NĖRA čia —
// ji DINAMIŠKAI generuojama per kelionę/išvykimą (žr. BuyTravellerInfo.tsx,
// BE travellerMemo.service.ts), ne statinis failas.
export const LEGAL_LINKS = {
  infoForm: `${API_URL}/documents/standartine_informacijos_teikimo_formapdf.pdf`,
  privacyPolicy: `${API_URL}/documents/privatumo-politika.pdf`,
  airCarriageConditions: `${API_URL}/documents/vezimo-oru-salygos.pdf`,
  tourismTerms: "https://prasmingas.lt/organizuotos-turistines-keliones-salygos.html",
} as const;
