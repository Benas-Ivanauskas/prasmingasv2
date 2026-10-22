import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import {
  createAdminTrip,
  deleteAdminTrip,
  getAdminTripById,
  listAdminTrips,
  updateAdminTrip,
} from "../services/adminTrip.service.js";
import { tripInputSchema } from "../services/adminTrip.schemas.js";

function requireAdminId(req: Request): string {
  if (!req.admin) {
    throw new ApiError(401, "Neprisijungta");
  }
  return req.admin.id;
}

function parseBody(req: Request) {
  const parsed = tripInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingi duomenys");
  }
  return parsed.data;
}

export async function listTrips(req: Request, res: Response) {
  const trips = await listAdminTrips();
  res.json(trips);
}

export async function getTrip(req: Request, res: Response) {
  const trip = await getAdminTripById(req.params.id as string);
  res.json(trip);
}

export async function createTrip(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const input = parseBody(req);
  const trip = await createAdminTrip(input, adminId);
  res.status(201).json(trip);
}

export async function updateTrip(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const input = parseBody(req);
  const force = req.query.force === "true";
  const trip = await updateAdminTrip(req.params.id as string, input, adminId, force);
  res.json(trip);
}

export async function deleteTrip(req: Request, res: Response) {
  const adminId = requireAdminId(req);
  const result = await deleteAdminTrip(req.params.id as string, adminId);
  res.json(result);
}
