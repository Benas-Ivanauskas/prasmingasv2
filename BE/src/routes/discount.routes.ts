import { Router } from "express";
import { validateDiscount } from "../controllers/discount.controller.js";
import { codeValidateRateLimit } from "../middleware/rateLimit.js";

export const discountRouter = Router();

discountRouter.post("/validate", codeValidateRateLimit, validateDiscount);
