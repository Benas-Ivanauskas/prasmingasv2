import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BusSeatMap from "../../components/BuySession/BusSeatMap";
import CruiseCabinPicker from "../../components/BuySession/CruiseCabinPicker";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import { holdSeats, holdFlightSeats, releaseHold, lookupDiscountCode } from "../../api/trips";
import type { DiscountValidation } from "../../types/discount";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import {
  getTripPricing,
  getCabinTypeLabel,
  getCabinUnitSize,
  getCabinPricing,
  getCheckoutTotals,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import type { SeatSelectionState } from "./buySessionTypes";
import "./BuyOneSession.css";

export default function BuyOneSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const { trip, departure, status } = useTripBySlug(slug, departureId);

  // Arriving fresh from Step 1 ("Kelionė"), or restored via Step 3's
  // "← Atgal" link — either way this already carries Step 1's decisions
  // (traveller count, discount code, deposit/invoice choices).
  const restoredSelection = location.state as SeatSelectionState | null;
  // Required headcount, decided in Step 1 — never re-asked here. BUS/CRUISE
  // must select exactly this many seats; FLIGHT has no seats to pick at all,
  // so this is simply shown as a fixed fact.
  const travellerCount = restoredSelection?.travellerCount ?? 1;

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    () => new Set(restoredSelection?.selectedSeatIds ?? [])
  );
  const [cabinSelections, setCabinSelections] = useState<Record<string, number>>(
    () => restoredSelection?.cabinSelections ?? {}
  );
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);
  const [holdError, setHoldError] = useState("");

  // Nuolaidos kodas nuspręstas Step 1 ir keliauja per restoredSelection —
  // pritaikomas ir čia, kad kaina rodoma renkantis vietas/kajutes jau jį
  // atspindėtų, ne tik žalią kainą už vietą.
  useEffect(() => {
    let cancelled = false;
    const discountCode = restoredSelection?.discountCode;
    if (discountCode) {
      lookupDiscountCode(discountCode).then((d) => {
        if (!cancelled) setAppliedDiscount(d ?? null);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [restoredSelection?.discountCode]);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <NotFound />;
  if (!departure) return <NotFound />;

  const pricing = getTripPricing(departure);
  const seats = departure.seats ?? [];
  const cabinTypes = departure.cabinTypes ?? [];

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else if (next.size < travellerCount) {
        next.add(seatId);
      } else if (travellerCount > 0) {
        // Already at the Step 1 traveller-count cap — swap out the OLDEST
        // pick instead of silently ignoring the click (a Set iterates in
        // insertion order, so .values().next() is the first one chosen).
        // Requiring a manual deselect first looked like a bug ("why can't
        // I pick a different seat?").
        const oldest = next.values().next().value;
        if (oldest) next.delete(oldest);
        next.add(seatId);
      }
      return next;
    });
  };

  // cabinSelections counts selectable units (places for QUAD, cabins for
  // DOUBLE/TRIPLE) — each covers getCabinUnitSize(type) travellers, so the
  // actual headcount (and thus bus seats/passengers) scales by that.
  const totalCabinTravellers = cabinTypes.reduce(
    (sum, c) => sum + (cabinSelections[c.id] ?? 0) * getCabinUnitSize(c.type),
    0
  );

  let totalPrice: number;
  let selectionSummary: string;
  let isValid: boolean;
  let passengerCount: number;

  if (trip.tripType === "BUS") {
    const seatNumbers = seats
      .filter((s) => selectedSeatIds.has(s.id))
      .map((s) => s.seatNumber)
      .join(", ");
    totalPrice = selectedSeatIds.size * pricing.finalCost;
    selectionSummary = seatNumbers
      ? `Pasirinktos vietos: ${seatNumbers} (${selectedSeatIds.size}/${travellerCount})`
      : `Pasirinkite vietas (0/${travellerCount})`;
    isValid = selectedSeatIds.size === travellerCount;
    passengerCount = selectedSeatIds.size;
  } else if (trip.tripType === "FLIGHT") {
    totalPrice = travellerCount * pricing.finalCost;
    selectionSummary = `Keleivių skaičius: ${travellerCount}`;
    isValid = travellerCount > 0;
    passengerCount = travellerCount;
  } else {
    const cabinSummary = cabinTypes
      .filter((c) => (cabinSelections[c.id] ?? 0) > 0)
      .map((c) => `${cabinSelections[c.id]}x ${getCabinTypeLabel(c.type)}`)
      .join(", ");
    totalPrice = cabinTypes.reduce(
      (sum, c) =>
        sum +
        (cabinSelections[c.id] ?? 0) * getCabinUnitSize(c.type) * getCabinPricing(c).finalPrice,
      0
    );
    selectionSummary = [
      `Autobuso vietos: ${selectedSeatIds.size}/${travellerCount}`,
      cabinSummary || null,
    ]
      .filter(Boolean)
      .join(" · ");
    isValid =
      selectedSeatIds.size === travellerCount && totalCabinTravellers === selectedSeatIds.size;
    passengerCount = totalCabinTravellers;
  }

  // The discount code and deposit choice were decided in Step 1 and travel
  // forward via restoredSelection (resolved async above, in the
  // appliedDiscount state) — applied here too so the price shown while
  // picking seats/cabins already reflects them, not just the raw per-seat
  // total.
  const { payingDeposit, amountDueNow, remainingAmount, remainingDueDate } = getCheckoutTotals(
    totalPrice,
    departure,
    appliedDiscount,
    restoredSelection?.wantsDeposit
  );
  const formattedTotal = formatEuro(amountDueNow);
  const routeLabel = `${trip.destinationCountry} · ${departure.durationDays} dienos`;
  const dateLabel = formatTripDate(departure.date);

  const handleContinue = async () => {
    // Arriving back here from Step 3 already left an active hold behind —
    // retire it before creating a fresh one so the same seats don't end up
    // under two holds at once (the older one expiring would otherwise free
    // them out from under the newer one). MUST be awaited, not
    // fire-and-forget: if the user kept the same seat/cabin selection
    // (common case — they just came back to tweak something else), the new
    // hold below targets the EXACT SAME Redis keys, and a still-pending
    // release would make the new hold falsely see them as taken.
    if (restoredSelection?.holdId) {
      try {
        await releaseHold(restoredSelection.holdId);
      } catch {
        // Best-effort — if this fails the old hold just expires on its own
        // TTL; it must not block creating the new one.
      }
    }

    // This is where the reservation session's TTL actually starts — not
    // whenever the payment page later happens to be opened. BUS/CRUISE hold
    // their specific seats; FLIGHT has no per-seat data, so it holds a
    // passenger count instead, on the exact same TTL/confirm/release lifecycle.
    // Now a real network call (Fazė 4) — can fail with 409 if someone else
    // grabbed the same seat(s)/the last ticket between page load and click.
    let hold: Pick<SeatSelectionState, "holdId" | "holdExpiresAt"> = {};
    try {
      if (trip.tripType === "FLIGHT") {
        const result = await holdFlightSeats(departure.id, travellerCount);
        hold = { holdId: result.holdId, holdExpiresAt: result.expiresAt };
      } else if (selectedSeatIds.size > 0) {
        // CRUISE: cabin picks go into the SAME hold as the bus seats (one
        // atomic reservation, released together) — BUS has none, so this is
        // always empty there.
        const cabinsToHold =
          trip.tripType === "CRUISE"
            ? Object.fromEntries(Object.entries(cabinSelections).filter(([, qty]) => qty > 0))
            : undefined;
        const result = await holdSeats(departure.id, Array.from(selectedSeatIds), cabinsToHold);
        hold = { holdId: result.holdId, holdExpiresAt: result.expiresAt };
      }
    } catch (err) {
      setHoldError(err instanceof Error ? err.message : "Nepavyko rezervuoti pasirinkimo");
      return;
    }
    setHoldError("");

    // Carried forward so later steps can show which seat each traveller got
    // and (for CRUISE) price by the actual cabin types picked here — plus
    // Step 1's own decisions, passed through untouched.
    const seatSelectionState: SeatSelectionState = {
      seatNumbers: seats
        .filter((s) => selectedSeatIds.has(s.id))
        .map((s) => s.seatNumber),
      selectedSeatIds: Array.from(selectedSeatIds),
      travellerCount,
      discountCode: restoredSelection?.discountCode,
      wantsDeposit: restoredSelection?.wantsDeposit,
      wantsInvoice: restoredSelection?.wantsInvoice,
      ...(trip.tripType === "CRUISE" ? { cabinSelections } : {}),
      ...hold,
    };
    navigate(`/buy/${trip.slug}/${departure.id}/travellers?count=${passengerCount}`, {
      state: seatSelectionState,
    });
  };

  return (
    <>
      <Header />

      <div className="container">
        <BuyStepper currentStep={2} />
        <Link
          to={`/buy/${trip.slug}/${departure.id}`}
          state={restoredSelection}
          className="buy-session-back-link"
        >
          ← Grįžti į kelionę
        </Link>
        <h1 className="buy-session-title">Pasirinkite vietas</h1>
        <p className="buy-session-subtitle">
          {trip.destinationCountry} · {dateLabel}
        </p>
        {/* The sidebar is a sibling of the content here (not of the header
            block above), so its top edge lines up with the seat map/cabin
            picker cards instead of the stepper/title. */}
        <div className="buy-session-body">
          <div className="buy-session-main">
            {trip.tripType === "BUS" && (
              <BusSeatMap
                seats={seats}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={toggleSeat}
              />
            )}

            {trip.tripType === "FLIGHT" && (
              <div className="buy-session-flight-fixed-count">
                <p>
                  Keleivių skaičius: <strong>{travellerCount}</strong>
                </p>
                <p className="buy-session-subtitle">
                  Keleivių skaičius jau pasirinktas ankstesniame žingsnyje.
                </p>
              </div>
            )}

            {trip.tripType === "CRUISE" && (
              <div className="buy-session-cruise-columns">
                <BusSeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={toggleSeat}
                />
                <CruiseCabinPicker
                  cabinTypes={cabinTypes}
                  selections={cabinSelections}
                  maxTravellers={selectedSeatIds.size}
                  onChange={(id, qty) =>
                    setCabinSelections((prev) => ({ ...prev, [id]: qty }))
                  }
                />
              </div>
            )}
          </div>

          <div>
            {holdError && <p className="hold-error">{holdError}</p>}
            <BuySessionSidebar
              trip={trip}
              routeLabel={routeLabel}
              dateLabel={dateLabel}
              selectionSummary={selectionSummary}
              formattedTotal={formattedTotal}
              totalNote={
                payingDeposit
                  ? `Depozitas — liks sumokėti ${formatEuro(remainingAmount)}${
                      remainingDueDate
                        ? ` — ${remainingDueDate} dieną atsiųsime mokėjimo nuorodą el. paštu`
                        : ""
                    }`
                  : undefined
              }
              isValid={isValid}
              onContinue={handleContinue}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
