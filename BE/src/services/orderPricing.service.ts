// Serverio pusės kainos perskaičiavimas — TIKSLIAI atkartoja
// FE/src/utils/tripHelpers.ts'o getTripPricing/getBookingBaseTotal/
// getCheckoutTotals algoritmą (tas pats apvalinimas), kad kliento peržiūrėta
// kaina ir serverio galutinė kaina sutaptų iki cento. Klientas SIŲSTOS sumos
// niekada nepasitima — ši funkcija yra vienintelis šaltinis checkout'ui.

export type CabinTypeName = "QUAD" | "DOUBLE" | "TRIPLE";

function getCabinCapacity(type: CabinTypeName): number {
  switch (type) {
    case "DOUBLE":
      return 2;
    case "TRIPLE":
      return 3;
    case "QUAD":
    default:
      return 4;
  }
}

// QUAD parduodama per vietą (1 lova = 1 žmogus), DOUBLE/TRIPLE — per visą kajutę.
export function getCabinUnitSize(type: CabinTypeName): number {
  return type === "QUAD" ? 1 : getCabinCapacity(type);
}

interface CabinTypeInput {
  id: string;
  type: CabinTypeName;
  pricePerPerson: number;
  discount: number | null;
}

function getCabinFinalPrice(cabin: CabinTypeInput): number {
  const discount = cabin.discount ?? 0;
  const hasDiscount = discount > 0;
  return Number((hasDiscount ? cabin.pricePerPerson * (1 - discount / 100) : cabin.pricePerPerson).toFixed(2));
}

interface DepartureInput {
  cost: number;
  discount: number | null;
  depositPercentage: number | null;
  depositDeadline: Date | null;
  remainingPaymentDays: number;
  date: Date;
}

function getDepartureFinalCost(departure: DepartureInput): number {
  const discount = departure.discount ?? 0;
  const hasDiscount = discount > 0;
  const calculated = hasDiscount ? departure.cost * (1 - discount / 100) : departure.cost;
  return Number(calculated.toFixed(2));
}

export interface PricingInput {
  tripType: "BUS" | "FLIGHT" | "CRUISE";
  departure: DepartureInput;
  cabinTypes: CabinTypeInput[];
  extraOptions: Array<{ id: string; name: string; price: number }>;
  travellerCount: number;
  cabinSelections?: Record<string, number>;
  travellerExtraIds: string[][]; // vienas įrašas per keleivį, ta pačia tvarka
  discount: { type: "PERCENTAGE" | "FIXED"; value: number } | null;
  wantsDeposit: boolean;
}

export interface PricingResult {
  baseTotal: number;
  extrasTotal: number;
  grandTotal: number;
  discountAmount: number;
  finalTotal: number;
  hasDepositOption: boolean;
  depositAmount: number;
  remainingAmount: number;
  payingDeposit: boolean;
  amountDueNow: number;
  remainingDueDate: Date | null;
  cabinBreakdown: Array<{
    cabinTypeId: string;
    type: CabinTypeName;
    qty: number;
    unitPrice: number;
    originalUnitPrice: number;
  }>;
  perTravellerExtras: Array<Array<{ extraOptionId: string; name: string; price: number }>>;
  departureDiscountPercent: number;
  departureDiscountAmount: number;
  baseUnitPrice: number;
  // Kaina PRIEŠ bet kokią nuolaidą — reikalinga sąskaitos faktūros "Bazinė
  // kelionės kaina" eilutei (isankstine-saskaita.pdf). BUS/FLIGHT: raw
  // departure.cost. CRUISE: žr. cabinBreakdown[].originalUnitPrice vietoj
  // šio (nėra vieno bendro vieneto kainos, priklauso nuo kajutės tipo).
  originalUnitPrice: number;
}

export function calculateOrderPricing(input: PricingInput): PricingResult {
  const { departure, cabinTypes, extraOptions, cabinSelections, travellerExtraIds, discount, wantsDeposit } = input;

  let baseTotal: number;
  let cabinBreakdown: PricingResult["cabinBreakdown"] = [];
  let baseUnitPrice: number;
  let originalUnitPrice: number;

  if (input.tripType === "CRUISE" && cabinSelections) {
    baseTotal = 0;
    for (const cabin of cabinTypes) {
      const qty = cabinSelections[cabin.id] ?? 0;
      if (qty <= 0) continue;
      const unitPrice = getCabinFinalPrice(cabin);
      const unitSize = getCabinUnitSize(cabin.type);
      baseTotal += qty * unitSize * unitPrice;
      cabinBreakdown.push({
        cabinTypeId: cabin.id,
        type: cabin.type,
        qty,
        unitPrice,
        originalUnitPrice: cabin.pricePerPerson,
      });
    }
    baseUnitPrice = cabinBreakdown[0]?.unitPrice ?? 0;
    originalUnitPrice = cabinBreakdown[0]?.originalUnitPrice ?? 0;
  } else {
    const finalCost = getDepartureFinalCost(departure);
    baseTotal = finalCost * input.travellerCount;
    baseUnitPrice = finalCost;
    originalUnitPrice = departure.cost;
  }

  const perTravellerExtras = travellerExtraIds.map((ids) =>
    ids
      .map((extraOptionId) => extraOptions.find((e) => e.id === extraOptionId))
      .filter((e): e is { id: string; name: string; price: number } => Boolean(e))
      .map((e) => ({ extraOptionId: e.id, name: e.name, price: e.price })),
  );
  const extrasTotal = perTravellerExtras.reduce(
    (sum, extras) => sum + extras.reduce((s, e) => s + e.price, 0),
    0,
  );

  const grandTotal = baseTotal + extrasTotal;

  const discountAmount = !discount
    ? 0
    : discount.type === "PERCENTAGE"
      ? grandTotal * (discount.value / 100)
      : Math.min(discount.value, grandTotal);
  const finalTotal = grandTotal - discountAmount;

  // Lyginama kaip datos-string (ne Date objektai), kad pati termino diena
  // vis dar leistų depozitą — terminas galioja tik SEKANČIĄ dieną.
  const depositPercentage = departure.depositPercentage ?? 0;
  const isPastDepositDeadline = departure.depositDeadline
    ? new Date().toISOString().slice(0, 10) > departure.depositDeadline.toISOString().slice(0, 10)
    : false;
  const hasDepositOption = depositPercentage > 0 && !isPastDepositDeadline;
  const depositAmount = hasDepositOption ? Math.round(finalTotal * (depositPercentage / 100) * 100) / 100 : 0;
  const remainingAmount = finalTotal - depositAmount;
  const payingDeposit = hasDepositOption && wantsDeposit;
  const amountDueNow = payingDeposit ? depositAmount : finalTotal;
  const remainingDueDate =
    payingDeposit && departure.remainingPaymentDays
      ? new Date(departure.date.getTime() - departure.remainingPaymentDays * 24 * 60 * 60 * 1000)
      : null;

  const departureDiscountPercent = input.tripType === "CRUISE" ? 0 : (departure.discount ?? 0);
  const departureOriginalTotal =
    input.tripType === "CRUISE" ? baseTotal : departure.cost * input.travellerCount;
  const departureDiscountAmount = departureOriginalTotal - baseTotal;

  return {
    baseTotal,
    extrasTotal,
    grandTotal,
    discountAmount,
    finalTotal,
    hasDepositOption,
    depositAmount,
    remainingAmount,
    payingDeposit,
    amountDueNow,
    remainingDueDate,
    cabinBreakdown,
    perTravellerExtras,
    departureDiscountPercent,
    departureDiscountAmount,
    baseUnitPrice,
    originalUnitPrice,
  };
}
