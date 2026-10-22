import { Router } from "express";
import { createHold, deleteHold } from "../controllers/hold.controller.js";
import { holdRateLimit } from "../middleware/rateLimit.js";

export const holdRouter = Router();

holdRouter.post("/departures/:id/hold", holdRateLimit, createHold);
holdRouter.delete("/holds/:holdId", deleteHold);
