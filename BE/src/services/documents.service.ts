import { logger } from "../lib/logger.js";

// SĄMONINGAI STUB — bet DABAR tik dėl PDF BIBLIOTEKOS pasirinkimo (el. pašto
// SIUNTIMAS jau realiai veikia — žr. email.service.ts, nodemailer/Gmail SMTP,
// naudojamas Fazėje 7-B ir patikrintas realiai). Laiškų TURINYS/tema jau
// užfiksuoti (žr. Fazė 6 skyrių žemiau) — lieka tik PDF priedų generavimas
// (keturi dinaminiai + du statiniai dokumentai, žr. "PDF priedai" skyrių).
// Webhook'as (webhook.service.ts) šią funkciją VIS TIEK kviečia po sėkmingo
// mokėjimo, kad srautas būtų pilnai sujungtas, bet ji tik loguoja ir grįžta —
// niekada nemeta klaidos (webhook'as jau atsakė "OK", šis žingsnis nebegali
// jo nutraukti). Order.documentsSent lieka false, tad kai generavimas bus
// realiai įgyvendintas, Fazės 8 retry cron'as automatiškai "pasivys" visus
// tarpiniu metu apmokėtus užsakymus.
export async function generateAndSendForOrder(orderId: string): Promise<void> {
  logger.info(
    { orderId },
    "Dokumento generavimas/siuntimas atidėtas — PDF biblioteka ir el. pašto providerius dar nepasirinkti",
  );
}
