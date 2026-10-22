import { Router } from "express";
import {
  createDiscount,
  deleteDiscount,
  getDiscount,
  listDiscounts,
  updateDiscount,
} from "../controllers/adminDiscount.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminDiscountRouter = Router();

adminDiscountRouter.use(requireAdmin);

adminDiscountRouter.get("/", listDiscounts);
adminDiscountRouter.get("/:id", getDiscount);
adminDiscountRouter.post("/", createDiscount);
adminDiscountRouter.put("/:id", updateDiscount);
adminDiscountRouter.delete("/:id", deleteDiscount);
