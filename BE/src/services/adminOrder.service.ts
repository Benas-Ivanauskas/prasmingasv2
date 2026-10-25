import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";
import { withAuditLog } from "./auditLog.service.js";
import { getHoldMeta, releaseHold } from "./hold.service.js";
import { calculateOrderPricing } from "./orderPricing.service.js";
import {
  checkoutDepartureSelect,
  toNumber,
  assertHoldMatches,
  assertHeadcountMatches,
  buildCruiseCabinAssignments,
  nextOrderNumber,
  releaseOrderInventory,
  createRemainingPaymentSession,
} from "./order.service.js";
import { sendRemainingPaymentEmail } from "./email.service.js";
import type { AdminManualOrderInput, AdminPaymentStatusInput } from "./adminOrder.schemas.js";

const adminOrderInclude = {
  departure: { select: { id: true, trip: { select: { id: true, title: true, tripType: true } } } },
  travellers: { include: { seat: { select: { id: true, seatNumber: true } } } },
  payments: { select: { provider: true, type: true, status: true }, orderBy: { createdAt: "desc" } },
} satisfies Prisma.OrderInclude;

type AdminOrderRow = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

// Realus Order neturi clientName/createdByAdmin laukų (FE mock-laikų
// išradimai) — abu čia IŠVEDAMI iš realių duomenų: clientName iš pirmo
// keleivio vardo (fallback — userEmail), createdByAdmin iš to, ar bent
// vienas Payment turi provider:"manual" (realus signalas iš schemos).
function serializeAdminOrder(order: AdminOrderRow) {
  const firstTraveller = order.travellers[0];
  const snapshot = order.priceSnapshot as { depositAmount?: number } | null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tripId: order.departure.trip.id,
    departureId: order.departureId,
    tripTitle: order.departure.trip.title,
    clientName: firstTraveller ? `${firstTraveller.firstName} ${firstTraveller.lastName}`.trim() : order.userEmail,
    phone: order.userPhone ?? "",
    email: order.userEmail,
    note: order.userComment ?? undefined,
    travellerCount: order.travellers.length,
    travellers: order.travellers.map((t) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      birthDate: t.birthDate.toISOString().slice(0, 10),
      personalCode: t.personalCode ?? "",
      passportNumber: t.passportNumber ?? "",
      passportExpiry: t.passportExpiry ? t.passportExpiry.toISOString().slice(0, 10) : "",
    })),
    seatIds: order.travellers.map((t) => t.seat?.id).filter((id): id is string => Boolean(id)),
    flightCount: order.departure.trip.tripType === "FLIGHT" ? order.travellers.length : undefined,
    totalAmount: toNumber(order.totalAmount),
    depositAmount: order.status === "DEPOSIT_PAID" ? snapshot?.depositAmount : undefined,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    createdByAdmin: order.payments.some((p) => p.provider === "manual"),
    // Step 1 "Su PVM sąskaita faktūra" pasirinkimas — kol kas tik rodoma
    // admin'ui, joks automatinis siuntimas dar šito nenaudoja (žr. planą,
    // "PVM sąskaitos siuntimas po kelionės" vis dar neįgyvendinta).
    wantsInvoice: order.wantsInvoice,
    // Paskutinio REMAINING tipo Payment būsena — null, jei dar nė karto
    // nebuvo bandyta siųsti likusio mokėjimo nuorodos šiam užsakymui.
    // `payments` jau rikiuoti createdAt desc, tad pirmas rastas yra
    // paskutinis bandymas (žr. createRemainingPaymentSession retry logiką).
    remainingPaymentStatus: order.payments.find((p) => p.type === "REMAINING")?.status ?? null,
  };
}

export async function listAdminOrders() {
  const orders = await prisma.order.findMany({
    include: adminOrderInclude,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(serializeAdminOrder);
}

export async function getAdminOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: adminOrderInclude });
  if (!order) {
    throw new ApiError(404, "Užsakymas nerastas");
  }
  return serializeAdminOrder(order);
}

export interface CreateAdminOrderResult {
  orderId: string;
  orderNumber: string;
}

// Glaudžiai veidrodinis order.service.ts::checkout() raštui (pakartotinai
// naudoja tas pačias eksportuotas gryna funkcijas), su admin'ui būdingais
// skirtumais: holdId vis tiek privalomas/tikrinamas (apsauga nuo lenktynių),
// bet NĖRA Paysera/redirect; Order.status = admin pasirinktas (ne visad
// PENDING_PAYMENT); Seat.status iškart TAKEN, jei ne PENDING_PAYMENT;
// totalAmount GALI būti admin'o perrašytas (trusted principal — viešas
// checkout'as tokio perrašymo niekada neleidžia).
export async function createAdminManualOrder(
  input: AdminManualOrderInput,
  adminId: string,
): Promise<CreateAdminOrderResult> {
  const departure = await prisma.departure.findUnique({
    where: { id: input.departureId },
    select: checkoutDepartureSelect,
  });
  if (!departure) {
    throw new ApiError(404, "Išvykimas nerastas");
  }

  const hold = await getHoldMeta(input.holdId);
  assertHoldMatches(hold, input);
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
    travellerExtraIds: input.travellers.map(() => []), // admin forma extrasų nerenka
    discount: null, // admin forma nuolaidos kodo nesirenka
    wantsDeposit: input.paymentStatus === "DEPOSIT_PAID",
  });

  const finalTotal = input.totalAmountOverride ?? pricing.finalTotal;
  const depositAmount =
    input.paymentStatus === "DEPOSIT_PAID" ? (input.depositAmount ?? pricing.depositAmount) : undefined;

  const priceSnapshot = {
    baseUnitPrice: pricing.baseUnitPrice,
    departureDiscountPercent: pricing.departureDiscountPercent,
    departureDiscountAmount: pricing.departureDiscountAmount,
    discountCode: null,
    discountCodeAmount: 0,
    extrasTotal: pricing.extrasTotal,
    cabinBreakdown: pricing.cabinBreakdown.length > 0 ? pricing.cabinBreakdown : null,
    grandTotal: pricing.grandTotal,
    finalTotal,
    hasDepositOption: pricing.hasDepositOption,
    depositPercentage: departure.depositPercentage,
    depositAmount: depositAmount ?? pricing.depositAmount,
    remainingAmount: finalTotal - (depositAmount ?? 0),
    payingDeposit: input.paymentStatus === "DEPOSIT_PAID",
    remainingDueDate: pricing.remainingDueDate ? pricing.remainingDueDate.toISOString() : null,
    adminOverrideApplied: input.totalAmountOverride !== undefined,
  };

  const cruiseAssignments =
    departure.trip.tripType === "CRUISE"
      ? buildCruiseCabinAssignments(input.cabinSelections ?? {}, departure.cabinTypes)
      : [];

  // PENDING_PAYMENT — vieta laikoma HELD (kaip ir viešo checkout'o atveju,
  // laukiant patvirtinimo), kitais atvejais admin JAU patvirtina kaip
  // apmokėtą, tad iškart TAKEN.
  const seatFinalStatus = input.paymentStatus === "PENDING_PAYMENT" ? "HELD" : "TAKEN";

  const createdOrder = await withAuditLog(
    async (tx) => {
      if (input.seatIds && input.seatIds.length > 0) {
        for (const seatId of input.seatIds) {
          const result = await tx.seat.updateMany({
            where: { id: seatId, departureId: input.departureId, status: "FREE" },
            data: { status: seatFinalStatus },
          });
          if (result.count !== 1) {
            throw new ApiError(409, "Viena ar kelios vietos nebeprieinamos — pasirinkite iš naujo");
          }
        }
      }

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
          status: input.paymentStatus,
          totalAmount: finalTotal,
          priceSnapshot,
          wantsInvoice: false,
          userComment: input.note,
          userEmail: input.email,
          userPhone: input.phone,
        },
      });

      for (let i = 0; i < input.travellers.length; i++) {
        const t = input.travellers[i]!;
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
            extras: { extras: [] },
          },
        });

        const seatId = input.seatIds?.[i];
        if (seatId) {
          await tx.seat.update({ where: { id: seatId }, data: { travellerId: traveller.id } });
        }
      }

      // Admin rankinis užsakymas turi lygiai VIENĄ Payment įrašą visą savo
      // gyvavimą (atnaujinamas vietoje vėliau per
      // updateAdminOrderPaymentStatus), skirtingai nuo viešo depozitas→
      // likutis srauto, kuris turės kelis atskirus Payment įrašus.
      const paymentAmount = input.paymentStatus === "DEPOSIT_PAID" ? (depositAmount ?? finalTotal) : finalTotal;
      await tx.payment.create({
        data: {
          orderId: order.id,
          type: input.paymentStatus === "DEPOSIT_PAID" ? "DEPOSIT" : "FULL",
          amount: paymentAmount,
          status: input.paymentStatus === "PENDING_PAYMENT" ? "PENDING" : "COMPLETED",
          paidAt: input.paymentStatus === "PENDING_PAYMENT" ? null : new Date(),
          provider: "manual",
          providerOrderId: `manual_${order.id}_${input.paymentStatus === "DEPOSIT_PAID" ? "deposit" : "full"}`,
        },
      });

      return order;
    },
    (order) => ({
      adminId,
      action: "order.manual_create",
      entityType: "Order",
      entityId: order.id,
      payload: { orderNumber: order.orderNumber, paymentStatus: input.paymentStatus },
    }),
  );

  // Redis — atskira sistema, NE Postgres transakcijos dalis. Nefatalu, jei
  // nepavyksta — hold'as savaime pasibaigs per TTL.
  try {
    await releaseHold(input.holdId);
  } catch (err) {
    logger.error(
      { err, holdId: input.holdId },
      "Nepavyko atlaisvinti hold'o po admin rankinio užsakymo — pasibaigs per TTL",
    );
  }

  return { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber };
}

export async function updateAdminOrderPaymentStatus(
  id: string,
  input: AdminPaymentStatusInput,
  adminId: string,
): Promise<{ status: string }> {
  const updated = await withAuditLog(
    async (tx) => {
      const existing = await tx.order.findUnique({ where: { id }, include: { payments: true } });
      if (!existing) {
        throw new ApiError(404, "Užsakymas nerastas");
      }
      // Apsauga nuo atsitiktinio REALAUS Paysera Payment'o "pažymėjimo apmokėtu" —
      // žemiau esantis kodas tiesiog mutuoja existing.payments[0] į COMPLETED,
      // kas būtų katastrofiška realiam, webhook'o dar laukiančiam užsakymui
      // (webhook'o idempotency patikra tada tyliai ignoruotų tikrą, vėliau
      // ateisiantį apmokėjimą). Šis endpoint'as skirtas TIK admin'o rankiniu
      // būdu sukurtiems užsakymams (provider:"manual").
      if (existing.payments.some((p) => p.provider !== "manual")) {
        throw new ApiError(
          409,
          "Šis užsakymas turi realų Paysera mokėjimą — statusas atsinaujins automatiškai po webhook'o patvirtinimo, rankinis pažymėjimas negalimas",
        );
      }

      const order = await tx.order.update({ where: { id }, data: { status: input.status } });

      // Admin rankinio užsakymo kelias turi lygiai vieną Payment eilutę —
      // atnaujinama VIETOJE, ne kuriama nauja (skirtingai nuo viešo
      // depozitas→likutis srauto su keliais Payment įrašais).
      const payment = existing.payments[0];
      const amount =
        input.status === "DEPOSIT_PAID" ? (input.depositAmount ?? toNumber(order.totalAmount)) : toNumber(order.totalAmount);
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            type: input.status === "DEPOSIT_PAID" ? "DEPOSIT" : "FULL",
            amount,
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }

      await tx.seat.updateMany({
        where: { traveller: { orderId: id }, status: "HELD" },
        data: { status: "TAKEN" },
      });

      return order;
    },
    (order) => ({
      adminId,
      action: "order.payment_status_update",
      entityType: "Order",
      entityId: order.id,
      payload: { status: input.status },
    }),
  );

  return { status: updated.status };
}

export async function cancelAdminOrder(id: string, adminId: string): Promise<{ status: string }> {
  const updated = await withAuditLog(
    async (tx) => {
      // Atominis apsauginis UPDATE — tas pats raštas kaip checkout'o vietos
      // užrakinime (order.service.ts). Jei šis endpoint'as iškviečiamas du
      // kartus lygiagrečiai (dvigubas paspaudimas, tinklo retry), TIK VIENAS
      // kvietimas realiai pakeičia statusą (count===1) ir tęsia į
      // releaseOrderInventory — kitas mato count===0 ir NIEKADA antrą kartą
      // nedekrementuoja CabinType.takenUnits/Departure.flightSeatsTaken
      // (anksčiau čia NEBUVO jokios tokios apsaugos — vien pakartotinis
      // paspaudimas būtų sugadinęs talpos skaitiklius CRUISE/FLIGHT kelionėms).
      const result = await tx.order.updateMany({
        where: { id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
        data: { status: "CANCELLED" },
      });

      if (result.count === 0) {
        const existing = await tx.order.findUnique({ where: { id }, select: { id: true, status: true } });
        if (!existing) {
          throw new ApiError(404, "Užsakymas nerastas");
        }
        return existing;
      }

      const existing = await tx.order.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          status: true,
          departureId: true,
          departure: { select: { trip: { select: { tripType: true } } } },
          travellers: { select: { id: true, cabinTypeId: true, cabinIndex: true } },
        },
      });
      await releaseOrderInventory(tx, existing);
      return existing;
    },
    (order) => ({
      adminId,
      action: "order.cancel",
      entityType: "Order",
      entityId: order.id,
    }),
  );

  return { status: updated.status };
}

export interface SendRemainingPaymentLinkResult {
  sent: boolean;
  redirectUrl: string;
}

export async function sendRemainingPaymentLink(
  orderId: string,
  adminId: string,
): Promise<SendRemainingPaymentLinkResult> {
  const { redirectUrl, amount } = await createRemainingPaymentSession(orderId);

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  let sent = false;
  try {
    await sendRemainingPaymentEmail({
      to: order.userEmail,
      orderNumber: order.orderNumber,
      amount,
      payUrl: redirectUrl,
    });
    sent = true;
    // SVARBU: žymima TIK PO sėkmingo laiško išsiuntimo — tas pats principas
    // kaip documentsSent (žr. schema.prisma komentarą). Šis laukas yra
    // vienintelis, bendras šaltinis tiesai tarp šio admin mygtuko IR
    // būsimo Fazės 8 cron'o — kuris pirmas sėkmingai išsiunčia, "užrakina"
    // užsakymą nuo antro (dubliuoto) siuntimo.
    await prisma.order.update({ where: { id: orderId }, data: { remainingPaymentLinkSentAt: new Date() } });
  } catch (err) {
    logger.error({ err, orderId }, "Nepavyko išsiųsti likusio mokėjimo laiško — nuoroda vis tiek grąžinama admin'ui");
  }

  // AuditLog rašomas tiesiogiai (ne per withAuditLog), nes čia sąmoningai
  // NEnorime vienos atominės transakcijos su Order.update — laiško
  // siuntimas yra TARPINIS, galimai lėtas/nepavykstantis žingsnis tarp jų.
  // Faktas "admin paprašė nusiųsti" yra tiesa nepriklausomai nuo rezultato.
  await prisma.auditLog.create({
    data: {
      adminId,
      action: "order.remaining_payment_link_sent",
      entityType: "Order",
      entityId: orderId,
      payload: { amount, emailSent: sent },
    },
  });

  return { sent, redirectUrl };
}
