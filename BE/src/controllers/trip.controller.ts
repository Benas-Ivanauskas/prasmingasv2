import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/errorHandler.js";
import { getPublicTripBySlug, listPublicTrips, type TripListFilters } from "../services/trip.service.js";

const listQuerySchema = z.object({
  tripType: z.enum(["BUS", "FLIGHT", "CRUISE"]).optional(),
  category: z.enum(["SIGHTSEEING", "LEISURE"]).optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
});

export async function listTrips(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Neteisingi paieškos parametrai");
  }

  const filters: TripListFilters = parsed.data;
  const trips = await listPublicTrips(filters);
  res.json(trips);
}

export async function getTripBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (typeof slug !== "string") {
    throw new ApiError(400, "Neteisingas adresas");
  }

  const trip = await getPublicTripBySlug(slug);
  if (!trip) {
    throw new ApiError(404, "Kelionė nerasta");
  }

  res.json(trip);
}
