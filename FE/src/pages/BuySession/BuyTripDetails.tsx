import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import { lookupDiscountCode } from "../../api/trips";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import {
  getTripDepartures,
  getTripPricing,
  getTripAvailability,
  getCheckoutTotals,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import type { SeatSelectionState } from "./buySessionTypes";
import "./BuyOneSession.css";
import "./BuyPayment.css";
import "./BuyTravellerInfo.css";
import "./BuyTripDetails.css";

export default function BuyTripDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const { trip, status } = useTripBySlug(slug);

  // Restores the previous selection when arriving via Step 2's "← Atgal"
  // link — otherwise (arriving fresh from the trip page) these are empty.
  const restoredSelection = location.state as SeatSelectionState | null;

  const [selectedDepartureId, setSelectedDepartureId] = useState(departureId ?? "");
  const [travellerCount, setTravellerCount] = useState(restoredSelection?.travellerCount ?? 1);
  const [discountInput, setDiscountInput] = useState(restoredSelection?.discountCode ?? "");
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<
    { code: string; type: "PERCENTAGE" | "FIXED"; value: number } | null
  >(null);
  const [wantsDeposit, setWantsDeposit] = useState(restoredSelection?.wantsDeposit ?? false);
  const [wantsInvoice, setWantsInvoice] = useState(restoredSelection?.wantsInvoice ?? false);
  const [companyName, setCompanyName] = useState(restoredSelection?.companyName ?? "");
  const [companyDetails, setCompanyDetails] = useState(restoredSelection?.companyDetails ?? "");

  // Restauruoja anksčiau pritaikytą nuolaidos kodą (atėjus iš Step 2
  // "← Atgal") — lookup dabar realus BE kvietimas, tad vyksta asinchroniškai
  // po mount'o, ne sinchroniniame useState inicializatoriuje.
  useEffect(() => {
    let cancelled = false;
    const discountCode = restoredSelection?.discountCode;
    if (discountCode) {
      lookupDiscountCode(discountCode).then((d) => {
        if (!cancelled && d) setAppliedDiscount({ code: discountCode, type: d.type, value: d.value });
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <NotFound />;

  const departures = getTripDepartures(trip);
  const departure = departures.find((d) => d.id === selectedDepartureId);

  if (!departure) return <NotFound />;

  const pricing = getTripPricing(departure);
  const seats = departure.seats ?? [];
  const freeSeatCount =
    trip.tripType === "FLIGHT"
      ? Math.max(0, (departure.flightSeatsTotal ?? 0) - (departure.flightSeatsTaken ?? 0))
      : seats.filter((s) => s.status === "FREE").length;

  const grandTotal = travellerCount * pricing.finalCost;
  const {
    hasDepositOption,
    depositAmount,
    remainingAmount,
    payingDeposit,
    amountDueNow,
    remainingDueDate,
  } = getCheckoutTotals(grandTotal, departure, appliedDiscount, wantsDeposit);

  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    const discount = await lookupDiscountCode(code);
    if (discount) {
      setAppliedDiscount({ code, type: discount.type, value: discount.value });
      setDiscountError("");
    } else {
      setAppliedDiscount(null);
      setDiscountError("Nuolaidos kodas neegzistuoja arba nebegalioja.");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError("");
  };

  const handleContinue = () => {
    const tripDetailsState: SeatSelectionState = {
      seatNumbers: [],
      travellerCount,
      discountCode: appliedDiscount?.code,
      wantsDeposit: payingDeposit,
      wantsInvoice,
      companyName: wantsInvoice ? companyName.trim() || undefined : undefined,
      companyDetails: wantsInvoice ? companyDetails.trim() || undefined : undefined,
    };
    navigate(`/buy/${trip.slug}/${departure.id}/seats`, { state: tripDetailsState });
  };

  return (
    <>
      <Header />

      <div className="container">
        <BuyStepper currentStep={1} />
        <h1 className="buy-session-title">Pasirinkite kelionės datą</h1>
        <p className="buy-session-subtitle">
          Pasirinkite datą ir keliautojų skaičių, kad galėtumėte tęsti rezervaciją.
        </p>

        <div className="buy-session-body">
          <div className="buy-session-main">
            <div className="traveller-card">
              <div className="traveller-fields">
                <label className="buy-trip-date-field">
                  Kelionės data *
                  <select
                    value={selectedDepartureId}
                    onChange={(e) => setSelectedDepartureId(e.target.value)}
                  >
                    {departures.map((dep) => {
                      const avail = getTripAvailability(dep);
                      return (
                        <option key={dep.id} value={dep.id} disabled={avail.isSoldOut}>
                          {formatTripDate(dep.date)}
                          {avail.isSoldOut ? " — vietų nėra" : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <div className="buy-trip-count-field">
                  <span>Keliautojų skaičius *</span>
                  <div className="buy-trip-count-control">
                    <button
                      type="button"
                      onClick={() => setTravellerCount((c) => Math.max(1, c - 1))}
                      disabled={travellerCount <= 1}
                      aria-label="Mažiau keliautojų"
                    >
                      −
                    </button>
                    <span className="buy-trip-count-value">{travellerCount}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTravellerCount((c) => Math.min(Math.max(1, freeSeatCount), c + 1))
                      }
                      disabled={travellerCount >= Math.max(1, freeSeatCount)}
                      aria-label="Daugiau keliautojų"
                    >
                      +
                    </button>
                  </div>
                  <span className="buy-trip-count-hint">
                    Laisvų vietų: {Math.max(0, freeSeatCount - travellerCount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="payment-section">
              <div className="buy-trip-discount">
                {appliedDiscount ? (
                  <div className="buy-trip-discount-applied">
                    <span>
                      Nuolaidos kodas pritaikytas: <strong>{appliedDiscount.code}</strong> (
                      {appliedDiscount.type === "PERCENTAGE"
                        ? `-${appliedDiscount.value}%`
                        : `-${formatEuro(appliedDiscount.value)}`}
                      )
                    </span>
                    <button type="button" onClick={handleRemoveDiscount}>
                      Pašalinti
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="payment-coupon">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => {
                          setDiscountInput(e.target.value);
                          setDiscountError("");
                        }}
                        placeholder="Nuolaidos kodas"
                      />
                      <button type="button" onClick={handleApplyDiscount}>
                        Taikyti
                      </button>
                    </div>
                    {discountError && <p className="payment-coupon-error">{discountError}</p>}
                  </>
                )}
              </div>
            </div>

            {hasDepositOption && (
              <div className="payment-section">
                <label className="traveller-invoice-option">
                  <input
                    type="checkbox"
                    checked={wantsDeposit}
                    onChange={(e) => setWantsDeposit(e.target.checked)}
                  />
                  Rinktis mokėti depozitą ({formatEuro(depositAmount)})
                </label>
                {payingDeposit && (
                  <p className="payment-deposit-note">
                    Šiandien mokėsite {formatEuro(depositAmount)}, likusius{" "}
                    {formatEuro(remainingAmount)}
                    {remainingDueDate
                      ? ` mokėjimo nuorodą atsiųsime el. paštu ${remainingDueDate} dieną`
                      : " sumokėsite vėliau"}
                    .
                  </p>
                )}
              </div>
            )}

            <div className="payment-section">
              <label className="traveller-invoice-option">
                <input
                  type="checkbox"
                  checked={wantsInvoice}
                  onChange={(e) => setWantsInvoice(e.target.checked)}
                />
                Noriu gauti sąskaitą faktūrą
              </label>
              {wantsInvoice && (
                <div className="traveller-fields" style={{ marginTop: "0.75rem" }}>
                  <label>
                    Įmonės pavadinimas
                    <input
                      type="text"
                      placeholder="Jei perka įmonė — palikite tuščia, jei fizinis asmuo"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </label>
                  <label>
                    Rekvizitai
                    <textarea
                      rows={3}
                      placeholder="Įmonės kodas, PVM mokėtojo kodas, adresas"
                      value={companyDetails}
                      onChange={(e) => setCompanyDetails(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <BuySessionSidebar
            trip={trip}
            title="Jūsų kelionė"
            routeLabel={`${trip.destinationCountry} · ${departure.durationDays} dienos`}
            dateLabel={formatTripDate(departure.date)}
            selectionSummary={`Keliautojų skaičius: ${travellerCount}`}
            formattedTotal={formatEuro(amountDueNow)}
            isValid={Boolean(selectedDepartureId)}
            onContinue={handleContinue}
            buttonLabel="Tęsti"
          />
        </div>
      </div>

      <Footer />
    </>
  );
}
