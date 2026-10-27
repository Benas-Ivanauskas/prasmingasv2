import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type TxClient = Prisma.TransactionClient;

// Laisvai plečiamas sąrašas — schema.prisma AuditLog.action yra String, ne
// enum, bet TS pusėje verta riboti žinomomis reikšmėmis, kad nebūtų typo.
export type AuditAction =
  | "trip.create"
  | "trip.update"
  | "trip.delete"
  | "trip.duplicate"
  | "discount.create"
  | "discount.update"
  | "discount.delete"
  | "order.cancel"
  | "order.manual_create"
  | "order.payment_status_update"
  | "order.remaining_payment_link_sent";

export interface AuditLogEntry {
  adminId: string;
  action: AuditAction;
  entityType: string; // "Trip" | "Discount" | "Order" ...
  entityId: string;
  payload?: Prisma.InputJsonValue;
}

export async function recordAuditLog(tx: TxClient, entry: AuditLogEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      adminId: entry.adminId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      payload: entry.payload ?? undefined,
    },
  });
}

// Apgaubia veiksmą + jo audit įrašą VIENOJE transakcijoje — jei audit
// įrašymas nepavyksta, visa operacija (trip.create/update ir pan.) atsistato.
// `fn` gauna transakcijos klientą `tx` (naudok JĮ, ne globalų `prisma`,
// kitaip veiksmas ir audit įrašas vyktų skirtingose transakcijose).
export async function withAuditLog<T>(
  fn: (tx: TxClient) => Promise<T>,
  buildEntry: (result: T) => AuditLogEntry,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const result = await fn(tx);
    await recordAuditLog(tx, buildEntry(result));
    return result;
  });
}

// Admin peržiūros puslapiui — naujausi pirmi, su admin email (ne vien raw
// adminId), kad būtų iškart aišku, KAS atliko veiksmą.
export async function listAuditLog(limit = 200) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { admin: { select: { email: true } } },
  });
}
