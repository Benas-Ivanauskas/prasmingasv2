import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

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
