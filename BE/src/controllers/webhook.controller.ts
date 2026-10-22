import type { Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import { processPayseraCallback } from "../services/webhook.service.js";

export async function payseraWebhookController(req: Request, res: Response) {
  const { data, ss1 } = req.query;

  // Svetainės patvirtinimo atvejis — Paysera, registruojant projekto
  // callbackurl, atsiunčia GET be data/ss1 parametrų ir tikisi šios meta
  // žymos atgal.
  if (typeof data !== "string" || typeof ss1 !== "string") {
    res
      .type("html")
      .send(`<html><head><meta name="verify-paysera" content="${env.paysera.verifyCode}"></head><body>OK</body></html>`);
    return;
  }

  // Atsakoma IŠ KARTO, prieš bet kokį apdorojimą — Paysera reikalauja
  // grynos "OK" eilutės per ~30s, nepriklausomai nuo apdorojimo trukmės.
  res.type("text").send("OK");

  // Fire-and-forget — klaida čia niekada nebegali paveikti jau išsiųsto
  // HTTP atsakymo.
  processPayseraCallback(data, ss1).catch((err) => {
    logger.error({ err }, "Paysera webhook apdorojimas nepavyko");
  });
}
