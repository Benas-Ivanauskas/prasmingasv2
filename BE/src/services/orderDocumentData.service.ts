import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";

// Bendras duomenų surinkimas sąskaitos (invoice.service.ts) IR sutarties
// (contract.service.ts) generavimui — viena DB užklausa vietoj dviejų,
// nes abu dokumentai naudoja beveik identišką Order/Traveller/Departure/
// Trip/Discount duomenų rinkinį.
export async function getOrderDocumentData(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      userEmail: true,
      userPhone: true,
      city: true,
      pickupCity: true,
      userComment: true,
      companyName: true,
      companyDetails: true,
      priceSnapshot: true,
      totalAmount: true,
      discount: { select: { code: true, type: true, value: true } },
      departure: {
        select: {
          date: true,
          durationDays: true,
          pickupPoints: true,
          trip: {
            select: {
              id: true,
              title: true,
              slug: true,
              destinationCountry: true,
              tripType: true,
              invoiceName: true,
            },
          },
        },
      },
      travellers: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          cabinTypeId: true,
          cabinIndex: true,
          extras: true,
          seat: { select: { seatNumber: true } },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Užsakymas nerastas");
  }

  return order;
}

export type OrderDocumentData = Awaited<ReturnType<typeof getOrderDocumentData>>;
