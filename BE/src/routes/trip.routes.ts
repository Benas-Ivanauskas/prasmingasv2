import { Router } from "express";
import { downloadTravellerMemo, downloadTripProgram, getTripBySlug, listTrips } from "../controllers/trip.controller.js";
import { memoRateLimit } from "../middleware/rateLimit.js";

export const tripRouter = Router();

tripRouter.get("/", listTrips);
tripRouter.get("/:slug/program.pdf", memoRateLimit, downloadTripProgram);
tripRouter.get("/:slug/departures/:departureId/memo.pdf", memoRateLimit, downloadTravellerMemo);
tripRouter.get("/:slug", getTripBySlug);
