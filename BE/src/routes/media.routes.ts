import { Router } from "express";
import { uploadMedia } from "../controllers/media.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { singleImageUpload } from "../middleware/upload.js";

export const mediaRouter = Router();

mediaRouter.post("/upload", requireAdmin, singleImageUpload("file"), uploadMedia);
