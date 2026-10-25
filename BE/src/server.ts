import cron from "node-cron";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { expireStuckOrders } from "./jobs/expireStuckOrders.job.js";
import { sendRemainingPaymentReminders } from "./jobs/sendRemainingPaymentReminders.job.js";
import { archiveFinishedDepartures } from "./jobs/archiveFinishedDepartures.job.js";

app.listen(env.port, () => {
  logger.info(`Server listening on http://localhost:${env.port}`);
  if (!env.paysera.projectId) {
    logger.warn(
      "Paysera credentials not configured — payment URLs will be non-functional until PAYSERA_PROJECT_ID/PAYSERA_SIGN_PASSWORD are set",
    );
  }
  if (!env.email.host) {
    logger.warn(
      "SMTP credentials not configured — remaining-payment reminder emails will fail until SMTP_HOST/SMTP_USER/SMTP_PASS are set",
    );
  }
});

// Fazė 8 — užstrigusių (niekad nei COMPLETED, nei FAILED negavusių) PENDING_PAYMENT
// užsakymų valymas, kas 15 min. Žr. jobs/expireStuckOrders.job.ts.
cron.schedule("*/15 * * * *", () => {
  expireStuckOrders().catch((err) => logger.error({ err }, "expireStuckOrders cron nepavyko"));
});

// Fazė 8 — automatinis likusio mokėjimo priminimas pagal kiekvienos Departure
// remainingPaymentDays terminą, kas 5 min. Žr. jobs/sendRemainingPaymentReminders.job.ts.
cron.schedule("*/5 * * * *", () => {
  sendRemainingPaymentReminders().catch((err) => logger.error({ err }, "sendRemainingPaymentReminders cron nepavyko"));
});

// Fazė 8 — praėjusių kelionių auto-archyvavimas (ACTIVE→DONE), kas 15 min
// (gamyboje pakaktų kartą per dieną, bet dažnesnis ritmas nekenksmingas ir
// patogesnis testuoti). Žr. jobs/archiveFinishedDepartures.job.ts.
cron.schedule("*/15 * * * *", () => {
  archiveFinishedDepartures().catch((err) => logger.error({ err }, "archiveFinishedDepartures cron nepavyko"));
});
