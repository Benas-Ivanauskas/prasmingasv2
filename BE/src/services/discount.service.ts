import type { Discount, DiscountType } from "@prisma/client";
import { ApiError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";
import { withAuditLog } from "./auditLog.service.js";
import type { DiscountInput } from "./discount.schemas.js";

export interface PublicDiscount {
  type: DiscountType;
  value: number;
}

// Vienas bendras klaidos pranešimas "nerastas"/"neaktyvus"/"pasibaigęs" —
// sąmoningai neatskiriama, kad nepadėtų perrinkti/išvardinti kodų.
export async function validateDiscountCode(rawCode: string): Promise<PublicDiscount> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new ApiError(400, "Įveskite nuolaidos kodą");
  }

  const discount = await prisma.discount.findUnique({ where: { code } });
  const today = new Date().toISOString().slice(0, 10);
  const expired = discount?.expiresAt ? today > discount.expiresAt.toISOString().slice(0, 10) : false;

  if (!discount || !discount.isActive || expired) {
    throw new ApiError(404, "Nuolaidos kodas neegzistuoja arba nebegalioja");
  }

  return { type: discount.type, value: Number(discount.value) };
}

function serializeDiscount(discount: Discount) {
  return {
    ...discount,
    value: Number(discount.value),
    // <input type="date"> FE pusėje priima TIK griežtą "YYYY-MM-DD" —
    // pilnas ISO datetime (numatytas Date objekto JSON serializavimas)
    // tyliai nerodomas, nors reikšmė realiai išsaugota (laukas tiesiog
    // atrodo tuščias). Čia, ne FE, nes tai vienintelis šaltinis tiesai.
    expiresAt: discount.expiresAt ? discount.expiresAt.toISOString().slice(0, 10) : null,
  };
}

async function assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
  const existing = await prisma.discount.findUnique({ where: { code } });
  if (existing && existing.id !== excludeId) {
    throw new ApiError(409, "Šis nuolaidos kodas jau naudojamas");
  }
}

function discountScalarData(input: DiscountInput) {
  return {
    code: input.code,
    type: input.type,
    value: input.value,
    isActive: input.isActive,
    // `new Date(...)` (be papildomo "T00:00:00.000Z" sulipdymo) teisingai
    // apdoroja abu atvejus: plikas "YYYY-MM-DD" (naujas pasirinkimas admin
    // formoje) IR pilną ISO timestamp (kai FE tiesiog siunčia atgal tai, ką
    // gavo iš GET /api/admin/discounts, pvz. perjungiant isActive) — ankstesnis
    // kodas sulipindavo antrą "T00:00:00.000Z" prie jau pilno ISO string'o,
    // sukurdamas Invalid Date.
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  };
}

export async function listAdminDiscounts() {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  return discounts.map(serializeDiscount);
}

export async function getAdminDiscountById(id: string) {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) {
    throw new ApiError(404, "Nuolaidos kodas nerastas");
  }
  return serializeDiscount(discount);
}

export async function createAdminDiscount(input: DiscountInput, adminId: string) {
  await assertCodeAvailable(input.code);

  const discount = await withAuditLog(
    (tx) => tx.discount.create({ data: discountScalarData(input) }),
    (created) => ({
      adminId,
      action: "discount.create",
      entityType: "Discount",
      entityId: created.id,
      payload: { code: created.code },
    }),
  );

  return serializeDiscount(discount);
}

export async function updateAdminDiscount(id: string, input: DiscountInput, adminId: string) {
  await assertCodeAvailable(input.code, id);

  const discount = await withAuditLog(
    async (tx) => {
      const existing = await tx.discount.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Nuolaidos kodas nerastas");
      }
      return tx.discount.update({ where: { id }, data: discountScalarData(input) });
    },
    (updated) => ({
      adminId,
      action: "discount.update",
      entityType: "Discount",
      entityId: updated.id,
      payload: { code: updated.code },
    }),
  );

  return serializeDiscount(discount);
}

// Jokio "ar jau panaudotas užsakyme" patikrinimo — vartotojo sprendimas:
// admin gali ištrinti bet kada, net jei kodas jau panaudotas/apmokėtas.
export async function deleteAdminDiscount(id: string, adminId: string) {
  return withAuditLog(
    async (tx) => {
      const existing = await tx.discount.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Nuolaidos kodas nerastas");
      }
      await tx.discount.delete({ where: { id } });
      return { id, code: existing.code };
    },
    (result) => ({
      adminId,
      action: "discount.delete",
      entityType: "Discount",
      entityId: result.id,
      payload: { code: result.code },
    }),
  );
}
