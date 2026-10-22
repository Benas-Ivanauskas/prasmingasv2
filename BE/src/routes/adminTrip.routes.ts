import { Router } from "express";
import {
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  updateTrip,
} from "../controllers/adminTrip.controller.js";
import { requireAdmin, requireRole } from "../middleware/requireAdmin.js";

export const adminTripRouter = Router();

adminTripRouter.use(requireAdmin);

adminTripRouter.get("/", listTrips);
adminTripRouter.get("/:id", getTrip);
adminTripRouter.post("/", createTrip);
adminTripRouter.put("/:id", updateTrip);
adminTripRouter.delete("/:id", requireRole("ADMIN"), deleteTrip);
