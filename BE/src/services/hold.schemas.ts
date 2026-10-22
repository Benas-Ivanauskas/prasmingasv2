import { z } from "zod";

export const holdInputSchema = z
  .object({
    seatIds: z.array(z.string().min(1)).optional(),
    // CRUISE: cabinTypeId -> kiekis (vietos QUAD tipui, kajutės DOUBLE/TRIPLE) —
    // siunčiama KARTU su seatIds viename kvietime/hold'e (autobuso vietos +
    // kajutės laikomos kaip vienas atominis rezervavimas, atlaisvinamas kartu).
    cabinSelections: z.record(z.string().min(1), z.number().int().positive()).optional(),
    flightCount: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      const hasSeatsOrCabins =
        Boolean(data.seatIds?.length) || Boolean(data.cabinSelections && Object.keys(data.cabinSelections).length > 0);
      return Boolean(data.flightCount) !== hasSeatsOrCabins;
    },
    {
      message: "Nurodykite arba flightCount, arba seatIds/cabinSelections (ne abu kartu ir ne nei vieno)",
    },
  );

export type HoldInput = z.infer<typeof holdInputSchema>;
