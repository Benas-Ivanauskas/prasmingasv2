import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { getHoldMeta, releaseHold } from "./hold.service.js";
import { createPaymentUrl } from "./paysera.service.js";
import { calculateOrderPricing, getCabinUnitSize, type CabinTypeName } from "./orderPricing.service.js";
import type { CheckoutInput, CheckoutTraveller } from "./order.schemas.js";

// Eksportuojama — adminOrder.service.ts'o rankinio užsakymo kelias
// pakartotinai naudoja tą pačią departūros select/kainos/validacijos
// logiką kaip viešas checkout, kad abu keliai niekad neišsiskirtų.
export const checkoutDepartureSelect = {
  id: true,
  date: true,
  cost: true,
  discount: true,
  depositPercentage: true,
  depositDeadline: true,
  remainingPaymentDays: true,
  flightSeatsTotal: true,
  flightSeatsTaken: true,
  trip: { select: { id: true, slug: true, title: true, tripType: true } },
  cabinTypes: {
    select: { id: true, type: true, pricePerPerson: true, discount: true, totalUnits: true, takenUnits: true },
  },
  extraOptions: { select: { id: true, name: true, price: true } },
} satisfies Prisma.DepartureSelect;

export type CheckoutDeparture = Prisma.DepartureGetPayload<{ select: typeof checkoutDepartureSelect }>;

export function toNumber(value: Prisma.Decimal | null): number {
  return value === null ? 0 : Number(value);
}

// Ta pati logika kaip discount.service.ts'o validateDiscountCode — tyčia
// neintegruota per tą funkciją, nes jos atsakymas (viešam /discounts/validate
// endpoint'ui) sąmoningai siauras (be `id`), o checkout'ui būtinas Discount.id
// (Order.discountId).
export async function findActiveDiscount(code: string) {
  const normalized = code.trim().toUpperCase();
  const discount = await prisma.discount.findUnique({ where: { code: normalized } });
  const today = new Date().toISOString().slice(0, 10);
  const expired = discount?.expiresAt ? today > discount.expiresAt.toISOString().slice(0, 10) : false;
  if (!discount || !discount.isActive || expired) {
    throw new ApiError(400, "Nuolaidos kodas nebegalioja — pašalinkite jį arba pasirinkite iš naujo");
  }
  return discount;
}

// Struktūrinis (ne CheckoutInput specifinis) tipas — adminOrder.service.ts'o
// AdminManualOrderInput irgi atitinka šią formą, tad ta pati funkcija
// pakartotinai naudojama abiejuose kūrimo keliuose be jokio pakeitimo.
export interface HoldMatchable {
  departureId: string;
  seatIds?: string[];
  cabinSelections?: Record<string, number>;
  flightCount?: number;
}

export function assertHoldMatches(
  hold: { departureId: string; seatIds?: string[]; cabinSelections?: Record<string, number>; flightCount?: number } | null,
  input: HoldMatchable,
): void {
  if (!hold || hold.departureId !== input.departureId) {
    throw new ApiError(409, "Rezervacija nebegalioja arba pasikeitė — pasirinkite iš naujo");
  }
  const sameSeats =
    JSON.stringify([...(hold.seatIds ?? [])].sort()) === JSON.stringify([...(input.seatIds ?? [])].sort());
  const sameCabins = JSON.stringify(hold.cabinSelections ?? {}) === JSON.stringify(input.cabinSelections ?? {});
  const sameFlightCount = (hold.flightCount ?? null) === (input.flightCount ?? null);
  if (!sameSeats || !sameCabins || !sameFlightCount) {
    throw new ApiError(409, "Rezervacija nebegalioja arba pasikeitė — pasirinkite iš naujo");
  }
}

// Serveris deterministiškai paskirsto pateiktus keleivius į kajučių
// vienetus pagal cabinSelections eiliškumą — sąmoningas supaprastinimas,
// nes FE dar neturi "šis žmogus į šią kajutę" pasirinkimo UI (žr. plano
// "Keleivio-kajutės priskyrimo riba").
export function buildCruiseCabinAssignments(
  cabinSelections: Record<string, number>,
  cabinTypes: Array<{ id: string; type: CabinTypeName }>,
): Array<{ cabinTypeId: string; cabinIndex: number }> {
  const assignments: Array<{ cabinTypeId: string; cabinIndex: number }> = [];
  for (const cabin of cabinTypes) {
    const qty = cabinSelections[cabin.id] ?? 0;
    if (qty <= 0) continue;
    const unitSize = getCabinUnitSize(cabin.type);
    for (let unit = 0; unit < qty; unit++) {
      for (let slot = 0; slot < unitSize; slot++) {
        assignments.push({ cabinTypeId: cabin.id, cabinIndex: unit });
      }
    }
  }
  return assignments;
}

export interface HeadcountMatchable {
  travellers: Array<{ firstName: string; lastName: string; passportNumber?: string; passportExpiry?: string }>;
  seatIds?: string[];
  cabinSelections?: Record<string, number>;
  flightCount?: number;
}

export function assertHeadcountMatches(departure: CheckoutDeparture, input: HeadcountMatchable): void {
  const travellerCount = input.travellers.length;
  const tripType = departure.trip.tripType;

  if (tripType === "FLIGHT") {
    if (input.flightCount !== travellerCount) {
      throw new ApiError(400, "Keleivių skaičius neatitinka bilietų kiekio");
    }
    for (const t of input.travellers) {
      if (!t.passportNumber?.trim() || !t.passportExpiry?.trim()) {
        throw new ApiError(400, `Trūksta ${t.firstName} ${t.lastName} paso duomenų`);
      }
    }
    return;
  }

  if (!input.seatIds || input.seatIds.length !== travellerCount) {
    throw new ApiError(400, "Pasirinktų vietų skaičius neatitinka keleivių skaičiaus");
  }

  if (tripType === "CRUISE") {
    const totalCabinTravellers = departure.cabinTypes.reduce(
      (sum, c) => sum + (input.cabinSelections?.[c.id] ?? 0) * getCabinUnitSize(c.type),
      0,
    );
    if (totalCabinTravellers !== travellerCount) {
      throw new ApiError(400, "Kajučių paskirstymas neatitinka keleivių skaičiaus");
    }
  }
}

export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ n: number }[]>`SELECT nextval('order_number_seq')::int AS n`;
  const n = rows[0]!.n;
  const year = new Date().getFullYear();
  return `PR-${year}-${String(n).padStart(5, "0")}`;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  redirectUrl: string;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const departure = await prisma.departure.findUnique({
    where: { id: input.departureId },
    select: checkoutDepartureSelect,
  });
  if (!departure) {
    throw new ApiError(404, "Išvykimas nerastas");
  }

  const hold = await getHoldMeta(input.holdId);
  assertHoldMatches(hold, input);

  const discountRow = input.discountCode ? await findActiveDiscount(input.discountCode) : null;

  assertHeadcountMatches(departure, input);

  const pricing = calculateOrderPricing({
    tripType: departure.trip.tripType,
    departure: {
      cost: toNumber(departure.cost),
      discount: departure.discount === null ? null : toNumber(departure.discount),
      depositPercentage: departure.depositPercentage,
      depositDeadline: departure.depositDeadline,
      remainingPaymentDays: departure.remainingPaymentDays,
      date: departure.date,
    },
    cabinTypes: departure.cabinTypes.map((c) => ({
      id: c.id,
      type: c.type,
      pricePerPerson: toNumber(c.pricePerPerson),
      discount: c.discount === null ? null : toNumber(c.discount),
    })),
    extraOptions: departure.extraOptions.map((e) => ({ id: e.id, name: e.name, price: toNumber(e.price) })),
    travellerCount: input.travellers.length,
    cabinSelections: input.cabinSelections,
    travellerExtraIds: input.travellers.map((t) => t.extraIds),
    discount: discountRow ? { type: discountRow.type, value: toNumber(discountRow.value) } : null,
    wantsDeposit: input.wantsDeposit,
  });

  if (input.wantsDeposit && !pricing.hasDepositOption) {
    throw new ApiError(
      400,
      "Depozito terminas pasibaigęs arba šiam išvykimui depozitas negalimas — reikalingas pilnas apmokėjimas",
    );
  }

  const priceSnapshot = {
    baseUnitPrice: pricing.baseUnitPrice,
    departureDiscountPercent: pricing.departureDiscountPercent,
    departureDiscountAmount: pricing.departureDiscountAmount,
    discountCode: discountRow?.code ?? null,
    discountCodeAmount: pricing.discountAmount,
    extrasTotal: pricing.extrasTotal,
    cabinBreakdown: pricing.cabinBreakdown.length > 0 ? pricing.cabinBreakdown : null,
    grandTotal: pricing.grandTotal,
    finalTotal: pricing.finalTotal,
    hasDepositOption: pricing.hasDepositOption,
    depositPercentage: departure.depositPercentage,
    depositAmount: pricing.depositAmount,
    remainingAmount: pricing.remainingAmount,
    payingDeposit: pricing.payingDeposit,
    remainingDueDate: pricing.remainingDueDate ? pricing.remainingDueDate.toISOString() : null,
  };

  const cruiseAssignments =
    departure.trip.tripType === "CRUISE"
      ? buildCruiseCabinAssignments(input.cabinSelections ?? {}, departure.cabinTypes)
      : [];

  const { order, payment } = await prisma.$transaction(
    async (tx) => {
      // Vietos lock (BUS/CRUISE) — ČIA, ne Redis hold'as, yra TIKROJI apsauga
      // nuo persidengiančio pardavimo.
      if (input.seatIds && input.seatIds.length > 0) {
        for (const seatId of input.seatIds) {
          const result = await tx.seat.updateMany({
            where: { id: seatId, departureId: input.departureId, status: "FREE" },
            data: { status: "HELD" },
          });
          if (result.count !== 1) {
            throw new ApiError(409, "Viena ar kelios vietos nebeprieinamos — pasirinkite iš naujo");
          }
        }
      }

      // CabinType lock (CRUISE) — raw SQL, nes predikatas lygina du stulpelius
      // (takenUnits + qty <= totalUnits), ko Prisma fluent API neišreiškia.
      if (input.cabinSelections) {
        for (const [cabinTypeId, qty] of Object.entries(input.cabinSelections)) {
          const affected = await tx.$executeRaw`
            UPDATE "CabinType"
            SET "takenUnits" = "takenUnits" + ${qty}
            WHERE id = ${cabinTypeId} AND "departureId" = ${input.departureId}
              AND "takenUnits" + ${qty} <= "totalUnits"
          `;
          if (affected !== 1) {
            throw new ApiError(409, "Viena ar kelios kajutės nebeprieinamos — pasirinkite iš naujo");
          }
        }
      }

      // Flight-count lock (FLIGHT) — tas pats raštas.
      if (input.flightCount) {
        const affected = await tx.$executeRaw`
          UPDATE "Departure"
          SET "flightSeatsTaken" = "flightSeatsTaken" + ${input.flightCount}
          WHERE id = ${input.departureId}
            AND "flightSeatsTaken" + ${input.flightCount} <= "flightSeatsTotal"
        `;
        if (affected !== 1) {
          throw new ApiError(409, "Nebeliko tiek laisvų bilietų — pasirinkite mažesnį kiekį");
        }
      }

      const orderNumber = await nextOrderNumber(tx);
      const order = await tx.order.create({
        data: {
          orderNumber,
          departureId: input.departureId,
          status: "PENDING_PAYMENT",
          totalAmount: pricing.finalTotal,
          priceSnapshot,
          wantsInvoice: input.wantsInvoice,
          userComment: input.userComment,
          discountId: discountRow?.id,
          userEmail: input.contact.email,
          userPhone: input.contact.phone,
          pickupCity: input.pickupCity,
          pickupTime: input.pickupTime,
        },
      });

      for (let i = 0; i < input.travellers.length; i++) {
        const t = input.travellers[i] as CheckoutTraveller;
        const assignment = cruiseAssignments[i];
        const traveller = await tx.traveller.create({
          data: {
            orderId: order.id,
            firstName: t.firstName,
            lastName: t.lastName,
            birthDate: new Date(t.birthDate),
            personalCode: t.personalCode || null,
            passportNumber: t.passportNumber || null,
            passportExpiry: t.passportExpiry ? new Date(t.passportExpiry) : null,
            cabinTypeId: assignment?.cabinTypeId,
            cabinIndex: assignment?.cabinIndex,
            extras: { extras: pricing.perTravellerExtras[i] ?? [] },
          },
        });

        const seatId = input.seatIds?.[i];
        if (seatId) {
          await tx.seat.update({ where: { id: seatId }, data: { travellerId: traveller.id } });
        }
      }

      const payingDeposit = pricing.payingDeposit;
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          type: payingDeposit ? "DEPOSIT" : "FULL",
          amount: payingDeposit ? pricing.depositAmount : pricing.finalTotal,
          status: "PENDING",
          provider: "paysera",
          providerOrderId: `ord_${order.id}_${payingDeposit ? "deposit" : "full"}`,
        },
      });

      return { order, payment };
    },
    { timeout: 10_000, maxWait: 5_000 },
  );

  // Redis — atskira sistema, NE Postgres transakcijos dalis. Order jau
  // sukurtas ir vietos jau lock'intos Postgres'e — nesėkmingas atlaisvinimas
  // čia yra nefatalus, hold'as tiesiog savaime pasibaigs per TTL.
  try {
    await releaseHold(input.holdId);
  } catch (err) {
    logger.error({ err, holdId: input.holdId }, "Nepavyko atlaisvinti hold'o po checkout — pasibaigs per TTL");
  }

  const redirectUrl = createPaymentUrl({
    orderId: payment.providerOrderId,
    amountCents: Math.round(Number(payment.amount) * 100),
    description: `Užsakymas ${order.orderNumber}`,
    accepturl: `${env.frontendUrl}/buy/${departure.trip.slug}/${departure.id}/success?orderId=${order.id}`,
    cancelurl: `${env.frontendUrl}/buy/${departure.trip.slug}/${departure.id}/cancelled?orderId=${order.id}`,
  });

  return { orderId: order.id, orderNumber: order.orderNumber, redirectUrl };
}

export interface OrderInventoryRelease {
  id: string;
  departureId: string;
  departure: { trip: { tripType: string } };
  travellers: Array<{ cabinTypeId: string | null; cabinIndex: number | null }>;
}

// Atlaisvina vietas/kajutes/flightSeatsTaken atgal į pulą — bendra tarp
// viešo cancel-pending (TIK PENDING_PAYMENT) ir admin rankinio atšaukimo
// (bet kokia būsena) — abu turi tą pačią inventoriaus grąžinimo logiką,
// skiriasi tik KADA ją leidžia kviesti. PRIVALO būti kviečiama TOS PAČIOS
// transakcijos `tx` viduje, kaip ir `Order.status` atnaujinimas.
export async function releaseOrderInventory(tx: Prisma.TransactionClient, order: OrderInventoryRelease): Promise<void> {
  await tx.seat.updateMany({
    where: { traveller: { orderId: order.id } },
    data: { status: "FREE", travellerId: null },
  });

  const cabinUnits = new Map<string, Set<number>>();
  for (const t of order.travellers) {
    if (!t.cabinTypeId || t.cabinIndex === null) continue;
    const set = cabinUnits.get(t.cabinTypeId) ?? new Set<number>();
    set.add(t.cabinIndex);
    cabinUnits.set(t.cabinTypeId, set);
  }
  for (const [cabinTypeId, units] of cabinUnits) {
    await tx.cabinType.update({
      where: { id: cabinTypeId },
      data: { takenUnits: { decrement: units.size } },
    });
  }

  if (order.departure.trip.tripType === "FLIGHT" && order.travellers.length > 0) {
    await tx.departure.update({
      where: { id: order.departureId },
      data: { flightSeatsTaken: { decrement: order.travellers.length } },
    });
  }
}

export async function cancelPendingOrder(orderId: string): Promise<{ status: string }> {
  return prisma.$transaction(async (tx) => {
    // Atominis apsauginis UPDATE — tas pats raštas kaip checkout'o vietos
    // užrakinime. Anksčiau statusas buvo tikrinamas ATSKIRU `findUnique`
    // PRIEŠ transakciją — du lygiagretūs kvietimai abu galėjo perskaityti
    // "PENDING_PAYMENT" prieš kuriam nors spėjant įrašyti "CANCELLED", ir
    // ABU atlaisvinti inventorių (dvigubas CabinType.takenUnits/
    // Departure.flightSeatsTaken dekrementavimas). Dabar TIK VIENAS
    // kvietimas (count===1) tęsia į releaseOrderInventory.
    const result = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    });

    if (result.count === 0) {
      const existing = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (!existing) {
        throw new ApiError(404, "Užsakymas nerastas");
      }
      // Idempotentinis no-op — niekada nenuleisti jau apmokėto/atšaukto
      // užsakymo. Saugu kviesti pakartotinai (pvz. naršyklės "atgal").
      return { status: existing.status };
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        id: true,
        departureId: true,
        departure: { select: { trip: { select: { tripType: true } } } },
        travellers: { select: { id: true, cabinTypeId: true, cabinIndex: true } },
      },
    });
    await releaseOrderInventory(tx, order);
    return { status: "CANCELLED" };
  });
}

export interface OrderStatusResult {
  orderNumber: string;
  status: string;
  email: string;
  travellerCount: number;
  seatNumbers: string[];
  pickupCity: string | null;
  depositAmount: number | null;
  remainingAmount: number | null;
  remainingDueDate: string | null;
}

// Naudojama BuySuccess.tsx'o — po realaus Paysera accepturl redirect'o,
// orderId ateina iš URL query param'o (ne router state, kuris dingsta per
// realų naršyklės redirect'ą).
export async function getOrderById(orderId: string): Promise<OrderStatusResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { travellers: { include: { seat: true } } },
  });
  if (!order) {
    throw new ApiError(404, "Užsakymas nerastas");
  }

  const snapshot = order.priceSnapshot as {
    depositAmount?: number;
    remainingAmount?: number;
    remainingDueDate?: string | null;
  };

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    email: order.userEmail,
    travellerCount: order.travellers.length,
    seatNumbers: order.travellers
      .map((t) => t.seat?.seatNumber)
      .filter((s): s is string => Boolean(s)),
    pickupCity: order.pickupCity,
    depositAmount: snapshot.depositAmount ?? null,
    remainingAmount: snapshot.remainingAmount ?? null,
    remainingDueDate: snapshot.remainingDueDate ?? null,
  };
}

export interface RemainingPaymentSession {
  redirectUrl: string;
  amount: number;
}

// GRYNA funkcija, be admin principal'o/AuditLog žinojimo — kad Fazė 8
// cron'as (vėliau, automatinis priminimas pagal departure.remainingPaymentDays
// terminą) galėtų ją kviesti tiesiogiai, be admin'o konteksto. Admin'ui
// skirtas apvalkalas (el. laiško siuntimas + AuditLog) yra
// adminOrder.service.ts::sendRemainingPaymentLink.
export async function createRemainingPaymentSession(orderId: string): Promise<RemainingPaymentSession> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      departure: { select: { id: true, trip: { select: { slug: true } } } },
      payments: { where: { type: "REMAINING" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) {
    throw new ApiError(404, "Užsakymas nerastas");
  }
  if (order.status !== "DEPOSIT_PAID") {
    throw new ApiError(409, "Užsakymas nėra depozito būsenoje — likusio mokėjimo nuoroda negalima");
  }

  const snapshot = order.priceSnapshot as { remainingAmount?: number };
  if (typeof snapshot.remainingAmount !== "number") {
    // Neturėtų nutikti — visi trys užsakymo kūrimo keliai šį lauką visada
    // užpildo. Jei vis tiek nutinka, tai priceSnapshot korupcijos ženklas —
    // NE tylus atsarginis variantas (būtų klaidinga suma klientui).
    throw new ApiError(500, "Užsakymo kainos duomenys nepilni — kreipkitės į kūrėjus");
  }
  const amount = snapshot.remainingAmount;
  if (amount <= 0) {
    throw new ApiError(409, "Likusi suma yra nulis arba neigiama — patikrinkite užsakymo duomenis");
  }

  // Jei egzistuoja dar neapmokėtas bandymas (admin paspaudė "siųsti" ar
  // "persiųsti" pakartotinai), naudojame TĄ PATĮ Payment įrašą/providerOrderId
  // — Paysera URL yra stateless/pasirašomas iš naujo kiekvieną kartą, tad
  // saugu generuoti jį pakartotinai tai pačiai sesijai.
  const existingPending = order.payments.find((p) => p.status === "PENDING");
  let providerOrderId: string;
  if (existingPending) {
    providerOrderId = existingPending.providerOrderId;
  } else {
    // Čia pasiekę — visi order.payments (jei yra) yra FAILED/CANCELLED
    // (COMPLETED neįmanomas — tada order.status būtų FULLY_PAID ir aukščiau
    // esanti patikra jau būtų sustabdžiusi; PENDING jau perimtas aukščiau).
    // Unikalus providerOrderId constraint reikalauja naujos reikšmės
    // kiekvienam naujam bandymui po nepavykusio senojo.
    const attemptIndex = order.payments.length;
    providerOrderId =
      attemptIndex === 0 ? `ord_${order.id}_remaining` : `ord_${order.id}_remaining_${attemptIndex + 1}`;
    try {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          type: "REMAINING",
          amount,
          status: "PENDING",
          provider: "paysera",
          providerOrderId,
        },
      });
    } catch (err) {
      // Lenktynės — du paspaudimai vienu metu abu nepamatė jokio PENDING
      // įrašo, abu bando sukurti tą patį providerOrderId.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(409, "Likusio mokėjimo nuoroda jau siunčiama — pabandykite dar kartą po akimirkos");
      }
      throw err;
    }
  }

  const redirectUrl = createPaymentUrl({
    orderId: providerOrderId,
    amountCents: Math.round(amount * 100),
    description: `Likusi suma — užsakymas ${order.orderNumber}`,
    accepturl: `${env.frontendUrl}/buy/${order.departure.trip.slug}/${order.departureId}/success?orderId=${order.id}`,
    cancelurl: `${env.frontendUrl}/buy/${order.departure.trip.slug}/${order.departureId}/cancelled?orderId=${order.id}`,
  });

  return { redirectUrl, amount };
}
