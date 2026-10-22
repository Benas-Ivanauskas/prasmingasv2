import { Router } from "express";
import { checkoutController, cancelPendingController, getOrderController } from "../controllers/order.controller.js";
import { checkoutRateLimit } from "../middleware/rateLimit.js";

export const orderRouter = Router();

orderRouter.post("/checkout", checkoutRateLimit, checkoutController);
orderRouter.get("/:id", getOrderController);
orderRouter.post("/:id/cancel-pending", cancelPendingController);
