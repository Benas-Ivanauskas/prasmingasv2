import { Router } from "express";
import { exportCsv } from "../controllers/newsletter.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminNewsletterRouter = Router();

adminNewsletterRouter.use(requireAdmin);

adminNewsletterRouter.get("/export.csv", exportCsv);
