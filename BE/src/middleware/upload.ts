import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "./errorHandler.js";

// Vietinis diskas — greitas dev sprendimas. NEpersist produkcijoje su keliais
// serveriais/redeploy'ais; prieš production reikės pakeisti į tikrą cloud
// storage (pvz. @vercel/blob, žr. BACKEND_IMPLEMENTATION_PLAN.md).
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — atitinka FE AdminImageUpload.tsx ribą

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Tik paveikslėlio failai leidžiami"));
      return;
    }
    cb(null, true);
  },
});

// multer's errors (fileFilter rejection, size-limit) bypass errorHandler's
// ApiError-based status mapping and default to 500 — šis wrapper'is
// konvertuoja juos į 400, kad klientas gautų teisingą status code.
export function singleImageUpload(fieldName: string) {
  const middleware = uploadImage.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Nepavyko įkelti failo";
        next(new ApiError(400, message));
        return;
      }
      next();
    });
  };
}
