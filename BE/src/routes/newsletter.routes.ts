import { Router } from "express";
import { subscribe } from "../controllers/newsletter.controller.js";
import { newsletterRateLimit } from "../middleware/rateLimit.js";

export const newsletterRouter = Router();

newsletterRouter.post("/subscribe", newsletterRateLimit, subscribe);
