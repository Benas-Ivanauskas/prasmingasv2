import { Router } from "express";
import { downloadTravellerMemo, getTripBySlug, listTrips } from "../controllers/trip.controller.js";
import { memoRateLimit } from "../middleware/rateLimit.js";

export const tripRouter = Router();

tripRouter.get("/", listTrips);
tripRouter.get("/:slug/departures/:departureId/memo.pdf", memoRateLimit, downloadTravellerMemo);
tripRouter.get("/:slug", getTripBySlug);
