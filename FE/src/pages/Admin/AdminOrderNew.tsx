import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminListTrips } from "../../api/adminTrips";
import { adminCreateManualOrder } from "../../api/adminOrders";
import { holdSeats, holdFlightSeats } from "../../api/trips";
import BusSeatMap from "../../components/BuySession/BusSeatMap";
import FlightTravellerStepper from "../../components/BuySession/FlightTravellerStepper";
import CruiseCabinPicker from "../../components/BuySession/CruiseCabinPicker";
import TravellerFields from "../../components/BuySession/TravellerFields";
import { NumberInput } from "./AdminFormFields";
import type { Trip } from "../../types/trip";
import type { OrderPaymentStatus, TravellerForm } from "../../types/order";
import {
  getTripPricing,
  getCabinUnitSize,
  getCabinPricing,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import { getEmailError } from "../../utils/validation";
import "../BuySession/BuyOneSession.css";

const PAYMENT_LABELS: Record<OrderPaymentStatus, string> = {
  PENDING_PAYMENT: "Dar neapmokėta",
  DEPOSIT_PAID: "Depozitas apmokėtas",
  FULLY_PAID: "Pilnas mokėjimas",
};

const emptyTraveller = (): TravellerForm => ({
  firstName: "",
  lastName: "",
  birthDate: "",
  personalCode: "",
  passportNumber: "",
  passportExpiry: "",
});

export default function AdminOrderNew() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState("");
  const [departureId, setDepartureId] = useState("");

  // Mirrors BuyOneSession.tsx's (Step 2 of the public flow) selection state
  // exactly, so this page reuses the same seat/cabin/flight-count UI.
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [flightTravellerCount, setFlightTravellerCount] = useState(1);
  const [cabinSelections, setCabinSelections] = useState<Record<string, number>>({});
  // Indexed by passengerCount below, which is derived (seats/stepper/cabin
  // picks) and can change as admin adjusts the selection — grown lazily in
  // updateTraveller rather than kept in exact sync via an effect.
  const [travellers, setTravellers] = useState<TravellerForm[]>([]);

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [totalAmountOverride, setTotalAmountOverride] = useState<number | null>(null);
  // Vieta/kajutė užimama IŠKART, nepriklausomai nuo šio pasirinkimo (žr.
  // handleSubmit) — admin dažniausiai užfiksuoja vietą TELEFONU sutarus,
  // o pinigai įkrenta vėliau, tad "dar neapmokėta" yra saugesnis numatytasis
  // pasirinkimas nei tvirtinti apmokėjimą, kurio dar nebuvo.
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatus>("PENDING_PAYMENT");
  const [depositAmount, setDepositAmount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminListTrips().then((list) => {
      if (!cancelled) setTrips(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trip = trips.find((t) => t.id === tripId);
  const departure = trip?.departures.find((d) => d.id === departureId);

  const resetSelection = () => {
    setSelectedSeatIds(new Set());
    setFlightTravellerCount(1);
    setCabinSelections({});
    setTotalAmountOverride(null);
    setTravellers([]);
  };

  const selectTrip = (id: string) => {
    setTripId(id);
    setDepartureId("");
    resetSelection();
  };

  const selectDeparture = (id: string) => {
    setDepartureId(id);
    resetSelection();
  };

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  };

  // Same per-trip-type passenger-count/price/validity logic as
  // BuyOneSession.tsx's handleContinue — copied, not shared, to keep that
  // page untouched.
  let passengerCount = 0;
  let computedTotal = 0;
  let selectionValid = false;

  if (trip && departure) {
    const pricing = getTripPricing(departure);
    const cabinTypes = departure.cabinTypes ?? [];

    if (trip.tripType === "BUS") {
      passengerCount = selectedSeatIds.size;
      computedTotal = selectedSeatIds.size * pricing.finalCost;
      selectionValid = selectedSeatIds.size > 0;
    } else if (trip.tripType === "FLIGHT") {
      passengerCount = flightTravellerCount;
      computedTotal = flightTravellerCount * pricing.finalCost;
      selectionValid = flightTravellerCount > 0;
    } else {
      // CRUISE: the real headcount is the bus seats picked (cabins only
      // ALLOCATE those same people into cabins, they don't define who
      // exists) — using totalCabinTravellers here instead made passengerCount
      // (and so the Keleiviai section below) stay at 0 right after picking
      // seats, until cabins were ALSO fully allocated, which looked like the
      // seat selection had vanished.
      const totalCabinTravellers = cabinTypes.reduce(
        (sum, c) => sum + (cabinSelections[c.id] ?? 0) * getCabinUnitSize(c.type),
        0
      );
      passengerCount = selectedSeatIds.size;
      computedTotal = cabinTypes.reduce(
        (sum, c) =>
          sum +
          (cabinSelections[c.id] ?? 0) * getCabinUnitSize(c.type) * getCabinPricing(c).finalPrice,
        0
      );
      selectionValid = totalCabinTravellers > 0 && selectedSeatIds.size === totalCabinTravellers;
    }
  }

  const totalAmount = totalAmountOverride ?? computedTotal;
  const isFlight = trip?.tripType === "FLIGHT";

  // Rendered (not stored) length always matches the current passengerCount —
  // entries beyond travellers' current length just show as blank until typed into.
  const displayedTravellers = Array.from(
    { length: passengerCount },
    (_, i) => travellers[i] ?? emptyTraveller()
  );

  const updateTraveller = (index: number, field: keyof TravellerForm, value: string) => {
    setTravellers((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push(emptyTraveller());
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!trip || !departure) {
      setError("Pasirinkite kelionę ir išvykimą.");
      return;
    }
    if (!selectionValid) {
      setError("Pasirinkite vietas / kajutę / keleivių skaičių.");
      return;
    }
    if (!clientName.trim()) {
      setError("Įveskite kliento vardą.");
      return;
    }
    if (!phone.trim()) {
      setError("Įveskite kliento telefono numerį.");
      return;
    }
    if (!email.trim()) {
      setError("Įveskite kliento el. paštą.");
      return;
    }
    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const incompleteIndex = displayedTravellers.findIndex(
      (t) =>
        !t.firstName.trim() ||
        !t.lastName.trim() ||
        !t.birthDate.trim() ||
        (isFlight && (!t.passportNumber.trim() || !t.passportExpiry.trim()))
    );
    if (incompleteIndex !== -1) {
      setError(`Užpildykite ${incompleteIndex + 1}. keleivio duomenis.`);
      return;
    }

    // Realus Redis hold (Fazė 4), lygiai kaip viešam checkout'ui — serveris
    // pats patikrina/atlaisvina `holdId` kurdamas užsakymą, apsaugai nuo
    // lenktynių su kitu admin skirtuku ar realiu klientu.
    let seatIds: string[] | undefined;
    let flightCount: number | undefined;
    let cabinsToHold: Record<string, number> | undefined;
    let holdId: string;

    try {
      if (trip.tripType === "FLIGHT") {
        const result = await holdFlightSeats(departure.id, flightTravellerCount);
        holdId = result.holdId;
        flightCount = flightTravellerCount;
      } else {
        seatIds = Array.from(selectedSeatIds);
        cabinsToHold =
          trip.tripType === "CRUISE"
            ? Object.fromEntries(Object.entries(cabinSelections).filter(([, qty]) => qty > 0))
            : undefined;
        const result = await holdSeats(departure.id, seatIds, cabinsToHold);
        holdId = result.holdId;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepavyko rezervuoti pasirinkimo");
      return;
    }

    try {
      await adminCreateManualOrder({
        departureId: departure.id,
        holdId,
        clientName: clientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim() || undefined,
        travellers: displayedTravellers,
        seatIds,
        cabinSelections: cabinsToHold,
        flightCount,
        totalAmountOverride: totalAmountOverride ?? undefined,
        depositAmount: paymentStatus === "DEPOSIT_PAID" ? depositAmount : undefined,
        paymentStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepavyko sukurti užsakymo");
      return;
    }

    navigate("/admin/orders");
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Naujas užsakymas (ranka)</h1>
          <p>Pasirinkite kelionę, vietas ir įveskite kliento duomenis.</p>
        </div>
        <Link to="/admin/orders" className="admin-btn-ghost">
          ← Atgal į užsakymus
        </Link>
      </div>

      <section className="admin-card">
        <h3>Kelionė</h3>
        <div className="admin-grid">
          <label className="admin-field">
            <span className="admin-field-label">Kelionė *</span>
            <select value={tripId} onChange={(e) => selectTrip(e.target.value)} required>
              <option value="">Pasirinkite…</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Išvykimas *</span>
            <select
              value={departureId}
              onChange={(e) => selectDeparture(e.target.value)}
              disabled={!trip}
              required
            >
              <option value="">Pasirinkite…</option>
              {trip?.departures.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatTripDate(d.date)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {trip && departure && (
        <section className="admin-card">
          <h3>Vietos</h3>
          {trip.tripType === "BUS" && (
            <BusSeatMap
              seats={departure.seats ?? []}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={toggleSeat}
            />
          )}

          {trip.tripType === "FLIGHT" && (
            <FlightTravellerStepper
              count={flightTravellerCount}
              min={1}
              max={Math.max(
                0,
                (departure.flightSeatsTotal ?? 0) - (departure.flightSeatsTaken ?? 0)
              )}
              onChange={setFlightTravellerCount}
            />
          )}

          {trip.tripType === "CRUISE" && (
            <div className="buy-session-cruise-columns">
              <BusSeatMap
                seats={departure.seats ?? []}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={toggleSeat}
              />
              <CruiseCabinPicker
                cabinTypes={departure.cabinTypes ?? []}
                selections={cabinSelections}
                maxTravellers={selectedSeatIds.size}
                onChange={(id, qty) => setCabinSelections((prev) => ({ ...prev, [id]: qty }))}
              />
            </div>
          )}

          <p className="admin-field-hint">
            Pasirinkta keleivių: {passengerCount} · Apskaičiuota kaina: {formatEuro(computedTotal)}
          </p>
        </section>
      )}

      {trip && departure && passengerCount > 0 && (
        <section className="admin-card">
          <h3>Keleiviai</h3>
          {displayedTravellers.map((traveller, index) => (
            <TravellerFields
              key={index}
              index={index}
              traveller={traveller}
              isFlight={Boolean(isFlight)}
              onChange={(field, value) => updateTraveller(index, field, value)}
            />
          ))}
        </section>
      )}

      <section className="admin-card">
        <h3>Kliento duomenys</h3>
        <p className="admin-field-hint">
          Kontaktinis asmuo (su kuriuo bendraujama) — gali, bet nebūtinai sutaps su kuriuo nors iš
          aukščiau įvestų keleivių.
        </p>
        <div className="admin-grid">
          <label className="admin-field">
            <span className="admin-field-label">Kliento vardas *</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Telefonas *</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">El. paštas *</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="admin-field is-wide">
            <span className="admin-field-label">Pastaba</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="admin-card">
        <h3>Mokėjimas</h3>
        <p className="admin-field-hint">
          Vieta/kajutė bus užimta iš karto, nepriklausomai nuo mokėjimo būsenos — atsilaisvins tik
          atšaukus užsakymą. "Dar neapmokėta" užsakymus vėliau pažymėsite apmokėtais sąraše.
        </p>
        <div className="admin-grid">
          <label className="admin-field">
            <span className="admin-field-label">Bendra suma (€)</span>
            <NumberInput
              min={0}
              step={0.01}
              value={totalAmount}
              onChange={(v) => setTotalAmountOverride(v)}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Mokėjimo būsena</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as OrderPaymentStatus)}
            >
              <option value="PENDING_PAYMENT">{PAYMENT_LABELS.PENDING_PAYMENT}</option>
              <option value="FULLY_PAID">{PAYMENT_LABELS.FULLY_PAID}</option>
              <option value="DEPOSIT_PAID">{PAYMENT_LABELS.DEPOSIT_PAID}</option>
            </select>
          </label>
          {paymentStatus === "DEPOSIT_PAID" && (
            <label className="admin-field">
              <span className="admin-field-label">Sumokėtas depozitas (€)</span>
              <NumberInput
                min={0}
                step={0.01}
                value={depositAmount}
                onChange={(v) => setDepositAmount(v ?? 0)}
              />
            </label>
          )}
        </div>
      </section>

      {error && (
        <div className="admin-errors" role="alert">
          <strong>{error}</strong>
        </div>
      )}

      <div className="admin-footer-actions">
        <Link to="/admin/orders" className="admin-btn-ghost">
          Atšaukti
        </Link>
        <button type="button" className="btn-primary" onClick={handleSubmit}>
          Sukurti užsakymą
        </button>
      </div>
    </>
  );
}
