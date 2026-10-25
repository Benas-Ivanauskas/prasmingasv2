import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { newsletterSubscribeSchema } from "../services/newsletter.schemas.js";
import { exportNewsletterCsv, subscribeToNewsletter } from "../services/newsletter.service.js";

export async function subscribe(req: Request, res: Response) {
  const parsed = newsletterSubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Neteisingas el. paštas");
  }

  await subscribeToNewsletter(parsed.data.email);
  res.status(201).json({ subscribed: true });
}

export async function exportCsv(req: Request, res: Response) {
  const csv = await exportNewsletterCsv();
  res
    .status(200)
    .set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="naujienlaiskio-prenumeratoriai.csv"',
    })
    .send(csv);
}
