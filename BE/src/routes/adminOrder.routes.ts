import { Router } from "express";
import {
  listOrders,
  getOrder,
  createManualOrder,
  updatePaymentStatus,
  cancelOrder,
  payRemaining,
} from "../controllers/adminOrder.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAdmin);

adminOrderRouter.get("/", listOrders);
adminOrderRouter.get("/:id", getOrder);
adminOrderRouter.post("/manual", createManualOrder);
adminOrderRouter.patch("/:id/payment-status", updatePaymentStatus);
adminOrderRouter.post("/:id/cancel", cancelOrder);
adminOrderRouter.post("/:id/pay-remaining", payRemaining);
