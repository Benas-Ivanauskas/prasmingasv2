import { logger } from "../lib/logger.js";

// SĄMONINGAI STUB — PDF biblioteka ir el. pašto providerius vartotojo
// sąmoningai atidėti ("vėliau papildysime"/"vėliau pasitvirtinsime", žr.
// BACKEND_IMPLEMENTATION_PLAN.md Fazė 6). Webhook'as (webhook.service.ts)
// šią funkciją VIS TIEK kviečia po sėkmingo mokėjimo, kad srautas būtų
// pilnai sujungtas, bet ji tik loguoja ir grįžta — niekada nemeta klaidos
// (webhook'as jau atsakė "OK", šis žingsnis nebegali jo nutraukti).
// Order.documentsSent lieka false, tad kai generavimas bus realiai
// įgyvendintas, Fazės 8 retry cron'as automatiškai "pasivys" visus
// tarpiniu metu apmokėtus užsakymus.
export async function generateAndSendForOrder(orderId: string): Promise<void> {
  logger.info(
    { orderId },
    "Dokumento generavimas/siuntimas atidėtas — PDF biblioteka ir el. pašto providerius dar nepasirinkti",
  );
}
