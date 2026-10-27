import { z } from "zod";

const travellerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1), // "YYYY-MM-DD"
  personalCode: z.string().optional(),
  // FLIGHT reikalaujami — tikrinama order.service.ts servise, ne čia, nes
  // zod šiame objekte neturi konteksto apie trip.tripType.
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  extraIds: z.array(z.string().min(1)).default([]),
});

export const checkoutInputSchema = z.object({
  departureId: z.string().min(1),
  holdId: z.string().min(1),
  travellers: z.array(travellerSchema).min(1),
  seatIds: z.array(z.string().min(1)).optional(), // BUS, arba CRUISE autobuso perkėlimo vietos
  cabinSelections: z.record(z.string().min(1), z.number().int().positive()).optional(), // CRUISE
  flightCount: z.number().int().positive().optional(), // FLIGHT
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(1),
    city: z.string().min(1),
  }),
  pickupCity: z.string().optional(),
  pickupTime: z.string().optional(),
  wantsInvoice: z.boolean().default(false),
  // Tik laisvo teksto laukai — asmuo/įmonė neatskiriama atskiru flag'u,
  // sprendžiama pagal tai, ar companyName užpildytas (žr. invoice.service.ts
  // ::buildInvoiceData). Abu neprivalomi net ir wantsInvoice=true atveju.
  companyName: z.string().trim().optional(),
  companyDetails: z.string().trim().optional(),
  wantsDeposit: z.boolean().default(false),
  discountCode: z.string().optional(),
  userComment: z.string().max(2000).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type CheckoutTraveller = CheckoutInput["travellers"][number];
