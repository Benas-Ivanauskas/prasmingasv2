import { z } from "zod";

export const discountInputSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((s) => s.trim().toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  // PERCENTAGE sąmoningai neribojama iki 100 — admin atsakomybė (vartotojo sprendimas).
  value: z.number().positive(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().nullable().optional(), // YYYY-MM-DD
});

export type DiscountInput = z.infer<typeof discountInputSchema>;

export const validateCodeBodySchema = z.object({
  code: z.string().min(1),
});
