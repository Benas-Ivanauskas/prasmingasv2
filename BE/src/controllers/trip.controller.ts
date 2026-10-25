import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/errorHandler.js";
import { getPublicTripBySlug, listPublicTrips, type TripListFilters } from "../services/trip.service.js";
import { generateTravellerMemoPdf, generateTripProgramPdf } from "../services/travellerMemo.service.js";

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

export async function downloadTripProgram(req: Request, res: Response) {
  const pdf = await generateTripProgramPdf(req.params.slug as string);
  res
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="keliones-programa.pdf"',
    })
    .send(pdf);
}

export async function downloadTravellerMemo(req: Request, res: Response) {
  const { slug, departureId } = req.params;
  const pdf = await generateTravellerMemoPdf(slug as string, departureId as string);
  res
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="atmintine.pdf"',
    })
    .send(pdf);
}
