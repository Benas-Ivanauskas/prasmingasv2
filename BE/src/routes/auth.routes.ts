import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { loginRateLimit } from "../middleware/rateLimit.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAdmin, me);
