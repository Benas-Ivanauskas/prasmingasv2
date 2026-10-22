import { Router } from "express";
import { getTripBySlug, listTrips } from "../controllers/trip.controller.js";

export const tripRouter = Router();

tripRouter.get("/", listTrips);
tripRouter.get("/:slug", getTripBySlug);
