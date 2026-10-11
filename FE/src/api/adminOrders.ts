import { mockOrders } from "../../orders";
import { mockTrips } from "../../trip";
import { generateOrderNumber } from "./trips";
import type { Order } from "../types/order";

// Admin-side order management. Placeholder data source: it mutates the
// same in-memory mockOrders array the public checkout (createOrder in
// api/trips.ts) writes to, so changes show up immediately but are lost on
// a page reload. Swap each function's body for real API calls once the
// backend exists — callers already treat these as async.

export async function adminListOrders(): Promise<Order[]> {
  return mockOrders;
}

// Releases the order's seats/flight count back to the departure (they were
// marked TAKEN via confirmHold at checkout, not HELD, so this is a small
// order-specific variant of api/trips.ts's hold-release logic) and marks
// the order CANCELLED — kept in the list as a record, not deleted.
export async function adminCancelOrder(id: string): Promise<void> {
  const order = mockOrders.find((o) => o.id === id);
  if (!order || order.status === "CANCELLED") return;

  const trip = mockTrips.find((t) => t.id === order.tripId);
  const departure = trip?.departures.find((d) => d.id === order.departureId);
  if (departure) {
    for (const seat of departure.seats ?? []) {
      if (seat.status === "TAKEN" && order.seatIds?.includes(seat.id)) {
        seat.status = "FREE";
      }
    }
    if (order.flightCount) {
      departure.flightSeatsTaken = Math.max(0, (departure.flightSeatsTaken ?? 0) - order.flightCount);
    }
  }

  order.status = "CANCELLED";
}

// The admin-side "+ Naujas užsakymas (ranka)" page — the caller is
// responsible for actually marking seats/flight count TAKEN first (via
// holdSeats/holdFlightSeats + confirmHold in api/trips.ts) and passing the
// same seatIds/flightCount here, so the order record matches real inventory.
export async function adminCreateManualOrder(
  input: Omit<Order, "id" | "orderNumber" | "createdAt" | "status" | "createdByAdmin">
): Promise<Order> {
  const order: Order = {
    ...input,
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    status: "ACTIVE",
    createdByAdmin: true,
  };
  mockOrders.push(order);
  return order;
}
