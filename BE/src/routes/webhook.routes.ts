import { Router } from "express";
import { payseraWebhookController } from "../controllers/webhook.controller.js";

export const webhookRouter = Router();

// Paysera siunčia GET (ne POST) pagal nutylėjimą.
webhookRouter.get("/paysera", payseraWebhookController);
