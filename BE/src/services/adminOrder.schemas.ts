import { z } from "zod";

const travellerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1), // "YYYY-MM-DD"
  personalCode: z.string().optional(),
  passportNumber: z.string().optional(), // FLIGHT privalomas — tikrinama servise
  passportExpiry: z.string().optional(),
});

export const adminManualOrderInputSchema = z.object({
  departureId: z.string().min(1),
  holdId: z.string().min(1),
  travellers: z.array(travellerSchema).min(1),
  seatIds: z.array(z.string().min(1)).optional(),
  cabinSelections: z.record(z.string().min(1), z.number().int().positive()).optional(),
  flightCount: z.number().int().positive().optional(),
  clientName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  // Order.city — sąskaitų "Adresas" šaltinis (žr. schema.prisma komentarą
  // prie Order.city). Privalomas čia lygiai taip pat, kaip viešame
  // checkout'e (order.schemas.ts::checkoutInputSchema).
  city: z.string().min(1),
  note: z.string().max(2000).optional(),
  totalAmountOverride: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["PENDING_PAYMENT", "DEPOSIT_PAID", "FULLY_PAID"]),
  depositAmount: z.number().nonnegative().optional(),
});

export type AdminManualOrderInput = z.infer<typeof adminManualOrderInputSchema>;

export const adminPaymentStatusInputSchema = z.object({
  status: z.enum(["DEPOSIT_PAID", "FULLY_PAID"]),
  depositAmount: z.number().nonnegative().optional(),
});

export type AdminPaymentStatusInput = z.infer<typeof adminPaymentStatusInputSchema>;
