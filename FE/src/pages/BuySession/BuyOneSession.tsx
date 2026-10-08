import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BusSeatMap from "../../components/BuySession/BusSeatMap";
import FlightTravellerStepper from "../../components/BuySession/FlightTravellerStepper";
import CruiseCabinPicker from "../../components/BuySession/CruiseCabinPicker";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import { holdSeats, holdFlightSeats, releaseHold } from "../../api/trips";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import {
  getTripPricing,
  getCabinTypeLabel,
  getCabinUnitSize,
  getCabinPricing,
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

  // Restores the previous selection when arriving via Step 3's "← Atgal"
  // link — otherwise (arriving fresh from the trip page) these are empty.
  const restoredSelection = location.state as SeatSelectionState | null;

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    () => new Set(restoredSelection?.selectedSeatIds ?? [])
  );
  // FLIGHT only — how many passengers the stepper is set to. Unrelated to
  // BUS/CRUISE's passengerCount below (derived from actual seats/cabins).
  const [flightTravellerCount, setFlightTravellerCount] = useState(
    restoredSelection?.travellerCount ?? 1
  );
  const [cabinSelections, setCabinSelections] = useState<Record<string, number>>(
    () => restoredSelection?.cabinSelections ?? {}
  );

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <StatusPage message="Kelionė nerasta." />;
  if (!departure) return <StatusPage message="Išvykimas nerastas." />;

  const pricing = getTripPricing(departure);
  const seats = departure.seats ?? [];
  const cabinTypes = departure.cabinTypes ?? [];

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
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
    selectionSummary = seatNumbers ? `Pasirinktos vietos: ${seatNumbers}` : "Pasirinkite vietas";
    isValid = selectedSeatIds.size > 0;
    passengerCount = selectedSeatIds.size;
  } else if (trip.tripType === "FLIGHT") {
    totalPrice = flightTravellerCount * pricing.finalCost;
    selectionSummary = `Keleivių skaičius: ${flightTravellerCount}`;
    isValid = flightTravellerCount > 0;
    passengerCount = flightTravellerCount;
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
      selectedSeatIds.size > 0 ? `Autobuso vietos: ${selectedSeatIds.size}` : null,
      cabinSummary || null,
    ]
      .filter(Boolean)
      .join(" · ") || "Pasirinkite kajutę ir autobuso vietas";
    isValid =
      totalCabinTravellers > 0 && selectedSeatIds.size === totalCabinTravellers;
    passengerCount = totalCabinTravellers;
  }

  const formattedTotal = formatEuro(totalPrice);
  const routeLabel = `${trip.destinationCountry} · ${departure.durationDays} dienos`;
  const dateLabel = formatTripDate(departure.date);

  const handleContinue = () => {
    // Arriving back here from Step 3 already left an active hold behind —
    // retire it before creating a fresh one so the same seats don't end up
    // under two holds at once (the older one expiring would otherwise free
    // them out from under the newer one).
    if (restoredSelection?.holdId) {
      releaseHold(restoredSelection.holdId);
    }

    // This is where the reservation session's TTL actually starts — not
    // whenever the payment page later happens to be opened. BUS/CRUISE hold
    // their specific seats; FLIGHT has no per-seat data, so it holds a
    // passenger count instead, on the exact same TTL/confirm/release lifecycle.
    let hold: Pick<SeatSelectionState, "holdId" | "holdExpiresAt"> = {};
    if (trip.tripType === "FLIGHT") {
      const result = holdFlightSeats(trip.id, departure.id, flightTravellerCount);
      hold = { holdId: result.holdId, holdExpiresAt: result.expiresAt };
    } else if (selectedSeatIds.size > 0) {
      const result = holdSeats(trip.id, departure.id, Array.from(selectedSeatIds));
      hold = { holdId: result.holdId, holdExpiresAt: result.expiresAt };
    }
    // Carried forward so later steps can show which seat each traveller got
    // and (for CRUISE) price by the actual cabin types picked here.
    const seatSelectionState: SeatSelectionState = {
      seatNumbers: seats
        .filter((s) => selectedSeatIds.has(s.id))
        .map((s) => s.seatNumber),
      selectedSeatIds: Array.from(selectedSeatIds),
      travellerCount: flightTravellerCount,
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
        <Link to={`/trips/${trip.slug}`} className="buy-session-back-link">
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
              <FlightTravellerStepper
                count={flightTravellerCount}
                min={1}
                max={Math.max(0, (departure.flightSeatsTotal ?? 0) - (departure.flightSeatsTaken ?? 0))}
                onChange={setFlightTravellerCount}
              />
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

          <BuySessionSidebar
            trip={trip}
            routeLabel={routeLabel}
            dateLabel={dateLabel}
            selectionSummary={selectionSummary}
            formattedTotal={formattedTotal}
            isValid={isValid}
            onContinue={handleContinue}
          />
        </div>
      </div>

      <Footer />
    </>
  );
}
