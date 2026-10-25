import type { Request, Response } from "express";
import { exportDepartureTravellersCsv } from "../services/adminExport.service.js";

export async function exportDepartureCsv(req: Request, res: Response) {
  const csv = await exportDepartureTravellersCsv(req.params.id as string);
  res
    .status(200)
    .set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keleiviai-${req.params.id}.csv"`,
    })
    .send(csv);
}
