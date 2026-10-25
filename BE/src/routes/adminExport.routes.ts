import { Router } from "express";
import { exportDepartureCsv } from "../controllers/adminExport.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminExportRouter = Router();

adminExportRouter.use(requireAdmin);

adminExportRouter.get("/departures/:id/export.csv", exportDepartureCsv);
