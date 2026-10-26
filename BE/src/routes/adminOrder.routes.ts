import { Router } from "express";
import {
  listOrders,
  getOrder,
  createManualOrder,
  updatePaymentStatus,
  cancelOrder,
  payRemaining,
  downloadInvoice,
  downloadContract,
  downloadVatInvoice,
} from "../controllers/adminOrder.controller.js";
import { requireAdmin, requireRole } from "../middleware/requireAdmin.js";

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAdmin);

adminOrderRouter.get("/", listOrders);
adminOrderRouter.get("/:id", getOrder);
adminOrderRouter.post("/manual", createManualOrder);
adminOrderRouter.patch("/:id/payment-status", updatePaymentStatus);
adminOrderRouter.post("/:id/cancel", requireRole("ADMIN"), cancelOrder);
adminOrderRouter.post("/:id/pay-remaining", payRemaining);
adminOrderRouter.get("/:id/invoice.pdf", downloadInvoice);
adminOrderRouter.get("/:id/contract.pdf", downloadContract);
adminOrderRouter.get("/:id/vat-invoice.pdf", downloadVatInvoice);
