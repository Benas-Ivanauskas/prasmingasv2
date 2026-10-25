import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { adminAuditLogRouter } from "./routes/adminAuditLog.routes.js";
import { adminDiscountRouter } from "./routes/adminDiscount.routes.js";
import { adminExportRouter } from "./routes/adminExport.routes.js";
import { adminOrderRouter } from "./routes/adminOrder.routes.js";
import { adminTripRouter } from "./routes/adminTrip.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { discountRouter } from "./routes/discount.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { holdRouter } from "./routes/hold.routes.js";
import { mediaRouter } from "./routes/media.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { tripRouter } from "./routes/trip.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { UPLOADS_DIR } from "./middleware/upload.js";

export const app = express();

// Produkcijoje nginx yra reverse proxy prieš Node (žr. VPS setup'ą) — be šito
// express-rate-limit meta ERR_ERL_UNEXPECTED_X_FORWARDED_FOR kiekvienai
// rate-limit'intai route'ai (login/discount/hold/checkout), nes Express pagal
// nutylėjimą nepasitiki X-Forwarded-For header'iu. "1" = pasitikima TIK
// vienu proxy hop'u priekyje (nginx), ne bet kuriuo klientu teigiamu IP.
app.set("trust proxy", 1);

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/trips", tripRouter);
app.use("/api/discounts", discountRouter);
app.use("/api/orders", orderRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/api", holdRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin", adminExportRouter);
app.use("/api/admin/trips", adminTripRouter);
app.use("/api/admin/media", mediaRouter);
app.use("/api/admin/discounts", adminDiscountRouter);
app.use("/api/admin/audit-log", adminAuditLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);
