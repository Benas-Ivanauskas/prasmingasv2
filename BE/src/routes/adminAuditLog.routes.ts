import { Router } from "express";
import { getAuditLog } from "../controllers/auditLog.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminAuditLogRouter = Router();

adminAuditLogRouter.use(requireAdmin);
adminAuditLogRouter.get("/", getAuditLog);
