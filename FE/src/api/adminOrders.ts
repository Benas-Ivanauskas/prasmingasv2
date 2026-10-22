import type { Order, OrderPaymentStatus, TravellerForm } from "../types/order";

// Realus BE kvietimas (ne mock duomenys) — Fazė 7-A. Sesija laikoma
// httpOnly cookie, tad visur `credentials: "include"`.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? "Įvyko klaida";
  } catch {
    return "Įvyko klaida";
  }
}

export async function adminListOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/admin/orders`, { credentials: "include" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// Admin gali atšaukti BET KOKIOS būsenos užsakymą, net jau apmokėtą —
// skirtingai nuo viešo self-service cancel-pending, kuris veikia tik
// PENDING_PAYMENT. Serveris pats atlaisvina vietas/kajutes/flightSeatsTaken.
export async function adminCancelOrder(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/orders/${id}/cancel`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

// Kviečiama užsakymų sąraše, kai PENDING_PAYMENT užsakymo pinigai realiai
// įkrenta — serveris pats atnaujina Payment įrašą ir pažymi Seat HELD→TAKEN.
export async function adminUpdateOrderPaymentStatus(
  id: string,
  status: Exclude<OrderPaymentStatus, "PENDING_PAYMENT">,
  depositAmount?: number
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/orders/${id}/payment-status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, depositAmount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export interface AdminManualOrderInput {
  departureId: string;
  // Admin UI jau sukuria realų Redis hold'ą (holdSeats/holdFlightSeats,
  // Fazė 4) prieš šį kvietimą — serveris jį patikrina/atlaisvina, lygiai
  // kaip viešame checkout'e, apsaugai nuo lenktynių.
  holdId: string;
  travellers: TravellerForm[];
  seatIds?: string[];
  cabinSelections?: Record<string, number>;
  flightCount?: number;
  clientName: string;
  phone: string;
  email: string;
  note?: string;
  // Admin GALI rankiniu būdu perrašyti sumą (derėtasi telefonu) —
  // leidžiama tik čia, NE viešam checkout'ui.
  totalAmountOverride?: number;
  paymentStatus: OrderPaymentStatus;
  depositAmount?: number;
}

export interface AdminManualOrderResult {
  orderId: string;
  orderNumber: string;
}

export async function adminCreateManualOrder(input: AdminManualOrderInput): Promise<AdminManualOrderResult> {
  const res = await fetch(`${API_URL}/api/admin/orders/manual`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface SendRemainingPaymentLinkResult {
  sent: boolean;
  redirectUrl: string;
}

// Admin'o rankinis "Siųsti likusio mokėjimo nuorodą" mygtukas (Fazė 7-B) —
// serveris sukuria/pakartotinai naudoja Paysera mokėjimo sesiją ir bando
// nusiųsti el. laišką; `sent:false` reiškia, kad laiškas nepavyko (dažniausiai
// SMTP dar nesukonfigūruotas), bet `redirectUrl` vis tiek grąžinama, kad
// admin galėtų nuorodą persiųsti kitu kanalu.
export async function adminSendRemainingPaymentLink(orderId: string): Promise<SendRemainingPaymentLinkResult> {
  const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/pay-remaining`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
