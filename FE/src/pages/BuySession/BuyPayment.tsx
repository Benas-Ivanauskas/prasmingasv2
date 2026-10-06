import { useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  IoMapOutline,
  IoCallOutline,
  IoPricetagOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoMailOutline,
  IoReceiptOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import ReservationTimerBanner from "../../components/BuySession/ReservationTimerBanner";
import { confirmHold } from "../../api/trips";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import { useCountdown } from "../../hooks/useCountdown";
import {
  getTripPricing,
  getCabinTypeLabel,
  getCabinCapacity,
  getBookingBaseTotal,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import type { BookingState } from "./buySessionTypes";
import "./BuyOneSession.css";
import "./BuyPayment.css";

// Mock-only codes — there's no backend to validate these against, so a
// couple of demo entries stand in for what would normally be API calls.
// Two distinct concepts, kept as separate mechanisms:
// - Discount code (mirrors schema.prisma's Discount model): a promo rule,
//   either PERCENTAGE or a FIXED € amount off.
// - Gift voucher: a prepaid € balance (bought/gifted beforehand) that's
//   credited toward the total like partial payment, not a promo rule.
const MOCK_DISCOUNT_CODES: Record<string, { type: "PERCENTAGE" | "FIXED"; value: number }> = {
  SAULE10: { type: "PERCENTAGE", value: 10 },
  KELIONE5: { type: "PERCENTAGE", value: 5 },
  KODAS20: { type: "FIXED", value: 20 },
};

const MOCK_VOUCHERS: Record<string, number> = {
  DOVANA100: 100,
  DOVANA50: 50,
};

function PaymentInfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="payment-info-row">
      <span className="payment-info-row-label">{label}</span>
      <span className={highlight ? "payment-info-row-value highlight" : "payment-info-row-value"}>
        {value}
      </span>
    </div>
  );
}

export default function BuyPayment() {
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const location = useLocation();
  const booking = (location.state as BookingState | null) ?? null;
  const { trip, departure, status } = useTripBySlug(slug, departureId);

  // Restored when arriving back here via Step 3's "← Atgal" link (which
  // round-trips whatever this page last sent it) — otherwise this page
  // starts blank, same as any first visit.
  const paymentExtras = booking?.paymentExtras;

  const [comment, setComment] = useState(paymentExtras?.comment ?? "");
  const [agreed, setAgreed] = useState(paymentExtras?.agreed ?? false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<
    { code: string; type: "PERCENTAGE" | "FIXED"; value: number } | null
  >(() => {
    const code = paymentExtras?.discountCode;
    const discount = code ? MOCK_DISCOUNT_CODES[code] : undefined;
    return discount ? { code, ...discount } : null;
  });
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; value: number } | null>(
    () => {
      const code = paymentExtras?.voucherCode;
      const value = code ? MOCK_VOUCHERS[code] : undefined;
      return value ? { code, value } : null;
    }
  );
  const secondsLeft = useCountdown(booking?.holdExpiresAt);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <StatusPage message="Kelionė nerasta." />;
  if (!departure) return <StatusPage message="Išvykimas nerastas." />;

  if (!booking) {
    return (
      <StatusPage
        message={
          <>
            Trūksta keleivių duomenų — grįžkite į ankstesnį žingsnį ir užpildykite juos iš naujo.
            <div>
              <Link to={`/buy/${trip.slug}/${departure.id}/travellers`}>
                ← Grįžti į keleivių duomenis
              </Link>
            </div>
          </>
        }
      />
    );
  }

  const hasHold = Boolean(booking.holdExpiresAt);
  const isHoldExpired = hasHold && secondsLeft <= 0;

  const pricing = getTripPricing(departure);
  const isCruise = trip.tripType === "CRUISE";
  const isFlight = trip.tripType === "FLIGHT";
  const extras = departure.extraOptions ?? [];
  const travellerCount = booking.travellers.length;
  const baseTotal = getBookingBaseTotal(trip, departure, travellerCount, booking.cabinSelections);
  const extrasTotal = booking.travellers.reduce(
    (sum, t) =>
      sum + extras.filter((e) => t.extraIds.includes(e.id)).reduce((s, e) => s + e.price, 0),
    0
  );
  const grandTotal = baseTotal + extrasTotal;
  // The departure's own sale price (pricing.discount), separate from a
  // promo code/voucher — shown as its own line so "what was the discount"
  // is never just folded invisibly into a single number.
  const baseOriginalTotal = isCruise ? baseTotal : pricing.originalCost * travellerCount;
  const departureDiscountAmount = baseOriginalTotal - baseTotal;
  const discountAmount = !appliedDiscount
    ? 0
    : appliedDiscount.type === "PERCENTAGE"
      ? grandTotal * (appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value, grandTotal);
  const discountLabel = appliedDiscount
    ? appliedDiscount.type === "PERCENTAGE"
      ? `-${appliedDiscount.value}%`
      : `-${appliedDiscount.value} €`
    : "";
  const afterDiscountTotal = grandTotal - discountAmount;
  // A voucher is credited like a partial payment — it can't push the total
  // below 0, and anything beyond the order's value is just left unused here
  // (there's no account/balance to carry it over to a future order).
  const voucherAmount = appliedVoucher ? Math.min(appliedVoucher.value, afterDiscountTotal) : 0;
  const voucherLeftover = appliedVoucher ? appliedVoucher.value - voucherAmount : 0;
  const finalTotal = afterDiscountTotal - voucherAmount;
  // Cruise prices by cabin, with no traveller-to-cabin mapping collected —
  // shown as a one-time breakdown instead of a (misleading) per-traveller price.
  const cabinBreakdown = isCruise
    ? (departure.cabinTypes ?? [])
        .filter((c) => (booking.cabinSelections?.[c.id] ?? 0) > 0)
        .map((c) => {
          const qty = booking.cabinSelections?.[c.id] ?? 0;
          const capacity = getCabinCapacity(c.type);
          return {
            id: c.id,
            label: getCabinTypeLabel(c.type),
            qty,
            totalPrice: qty * capacity * c.pricePerPerson,
          };
        })
    : [];
  // CRUISE prices by cabin (shown above), so a per-traveller price badge
  // would be misleading there — FLIGHT/BUS always show it.
  const showPriceColumn = !isCruise;

  const handleApplyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    const discount = MOCK_DISCOUNT_CODES[code];
    if (discount) {
      setAppliedDiscount({ code, ...discount });
      setDiscountError("");
    } else {
      setAppliedDiscount(null);
      setDiscountError("Nuolaidos kodas neegzistuoja arba nebegalioja.");
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const value = MOCK_VOUCHERS[code];
    if (value) {
      setAppliedVoucher({ code, value });
      setVoucherError("");
    } else {
      setAppliedVoucher(null);
      setVoucherError("Kuponas neegzistuoja arba jau panaudotas.");
    }
  };

  // What "← Atgal" hands back to Step 3 — the booking as received, plus
  // this page's own current fields, so a round trip back here restores
  // exactly what was typed/applied instead of resetting to blank.
  const backState: BookingState = {
    ...booking,
    paymentExtras: {
      comment,
      agreed,
      discountCode: appliedDiscount?.code,
      voucherCode: appliedVoucher?.code,
    },
  };

  const handlePay = () => {
    if (isHoldExpired) return;
    // Turns the held seats permanent (TAKEN) instead of leaving them to
    // expire — the swap point for a real "confirm order" endpoint later.
    if (booking.holdId) {
      confirmHold(booking.holdId);
    }
    console.log("Payment submitted:", {
      tripId: trip.id,
      departureId: departure.id,
      booking,
      comment,
      appliedDiscount,
      appliedVoucher,
      finalTotal,
    });
  };

  return (
    <>
      <Header />

      <div className="container">
        <BuyStepper currentStep={4} />
        <Link
          to={`/buy/${trip.slug}/${departure.id}/travellers?count=${travellerCount}`}
          state={backState}
          className="buy-session-back-link"
        >
          ← Grįžti į keleivių duomenis
        </Link>
        <h1 className="buy-session-title">Apmokėjimas</h1>
        <p className="buy-session-subtitle">Peržiūrėkite užsakymo informaciją prieš apmokėjimą</p>

        {/* The sidebar is a sibling of the content here (not of the header
            block above), so its top edge lines up with the reservation
            banner/cards instead of the stepper/title. */}
        <div className="buy-session-body">
        <div className="buy-session-main">
          <ReservationTimerBanner
            holdExpiresAt={booking.holdExpiresAt}
            secondsLeft={secondsLeft}
            seatsPickerUrl={`/buy/${trip.slug}/${departure.id}`}
          />

          <div className="payment-section">
            <div className="payment-section-label">
              <IoMapOutline aria-hidden="true" />
              Kelionė
            </div>
            <div className="payment-trip-card">
              <div className="payment-trip-title">{trip.title}</div>
              <div className="payment-trip-facts">
                <span className="payment-fact">
                  <IoCalendarOutline aria-hidden="true" />
                  {formatTripDate(departure.date)}
                </span>
                <span className="payment-fact">{departure.durationDays} d.</span>
                {booking.contact.pickupCity && (
                  <span className="payment-fact">
                    <IoLocationOutline aria-hidden="true" />
                    {booking.contact.pickupCity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {cabinBreakdown.length > 0 && (
            <div className="payment-section">
              <div className="payment-section-label">
                <IoPricetagOutline aria-hidden="true" />
                Pasirinktos kajutės
              </div>
              <div className="payment-info-box">
                {cabinBreakdown.map((c) => (
                  <PaymentInfoRow
                    key={c.id}
                    label={`${c.qty} × ${c.label}`}
                    value={formatEuro(c.totalPrice)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="payment-section">
            <h3 className="payment-travellers-heading">Keleiviai ({travellerCount})</h3>
            {booking.travellers.map((t, i) => {
              const travellerExtras = extras.filter((e) => t.extraIds.includes(e.id));
              const travellerExtrasSum = travellerExtras.reduce((s, e) => s + e.price, 0);
              const seatNumber = booking.seatNumbers[i];
              const travellerTotal = pricing.finalCost + travellerExtrasSum;
              const initials =
                `${t.firstName[0] ?? ""}${t.lastName[0] ?? ""}`.toUpperCase() || "?";
              return (
                <div key={i} className="payment-traveller-card">
                  <div className="payment-traveller-top">
                    <span className="payment-traveller-avatar" aria-hidden="true">
                      {initials}
                    </span>
                    <div className="payment-traveller-identity">
                      <div className="payment-traveller-name">
                        {t.firstName} {t.lastName}
                      </div>
                      <div className="payment-traveller-meta">
                        {seatNumber && <span>Vieta Nr. {seatNumber}</span>}
                        <span>Gim. {t.birthDate}</span>
                      </div>
                    </div>
                    {/* Always shown right here — too important to bury in
                        the details below. */}
                    {showPriceColumn && (
                      <div className="payment-traveller-price">
                        {pricing.hasDiscount && (
                          <del className="payment-traveller-price-original">
                            {pricing.formattedOriginalPrice}
                          </del>
                        )}
                        <strong>{formatEuro(travellerTotal)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="payment-traveller-details">
                    <div className="payment-detail">
                      <span className="payment-detail-label">Asmens kodas</span>
                      <span className="payment-detail-value">{t.personalCode || "–"}</span>
                    </div>
                    {isFlight && (
                      <>
                        <div className="payment-detail">
                          <span className="payment-detail-label">Paso numeris</span>
                          <span className="payment-detail-value">{t.passportNumber}</span>
                        </div>
                        <div className="payment-detail">
                          <span className="payment-detail-label">Paso galiojimo data</span>
                          <span className="payment-detail-value">{t.passportExpiry}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {travellerExtras.length > 0 && (
                    <div className="payment-traveller-extras">
                      {travellerExtras.map((e) => (
                        <span key={e.id} className="payment-extra-chip">
                          {e.name} <strong>+{formatEuro(e.price)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {showPriceColumn && (
                    <div className="payment-traveller-price-note">
                      Bazinė kaina {pricing.formattedOriginalPrice}
                      {pricing.hasDiscount &&
                        ` · -${formatEuro(pricing.originalCost - pricing.finalCost)} nuolaida (${pricing.discount}%)`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="payment-section">
            <div className="payment-section-label">
              <IoCallOutline aria-hidden="true" />
              Kontaktinė informacija
            </div>
            <div className="payment-contact-chips">
              <span className="payment-contact-chip">
                <IoMailOutline aria-hidden="true" />
                {booking.contact.email}
              </span>
              <span className="payment-contact-chip">
                <IoCallOutline aria-hidden="true" />
                {booking.contact.phone}
              </span>
              <span className="payment-contact-chip">
                <IoLocationOutline aria-hidden="true" />
                {booking.contact.city}
              </span>
              <span className="payment-contact-chip">
                <IoReceiptOutline aria-hidden="true" />
                {booking.contact.wantsInvoice ? "Su PVM sąskaita faktūra" : "Be sąskaitos faktūros"}
              </span>
            </div>
          </div>

          <div className="payment-section">
            <div className="payment-section-label">
              <IoPricetagOutline aria-hidden="true" />
              Kainos suvestinė
            </div>
            <div className="payment-info-box">
              <PaymentInfoRow label="Kelionės kaina" value={formatEuro(baseOriginalTotal)} />
              {!isCruise && pricing.hasDiscount && (
                <PaymentInfoRow
                  label={`Nuolaida (${pricing.discount}%)`}
                  value={`-${formatEuro(departureDiscountAmount)}`}
                />
              )}
              {extrasTotal > 0 && (
                <PaymentInfoRow
                  label="Papildomos paslaugos"
                  value={`+${formatEuro(extrasTotal)}`}
                />
              )}
              {appliedDiscount && (
                <PaymentInfoRow
                  label={`Nuolaidos kodas (${appliedDiscount.code})`}
                  value={`-${formatEuro(discountAmount)}`}
                />
              )}
              {appliedVoucher && (
                <PaymentInfoRow
                  label={`Dovanų kuponas (${appliedVoucher.code})`}
                  value={`-${formatEuro(voucherAmount)}`}
                />
              )}
              {voucherLeftover > 0 && (
                <PaymentInfoRow
                  label="Nepanaudota kupono likutis"
                  value={formatEuro(voucherLeftover)}
                />
              )}
            </div>
          </div>

          <div className="payment-section">
            <div className="payment-totals">
              <span>Viso keliautojų: {travellerCount}</span>
              <span>Viso: {formatEuro(finalTotal)}</span>
            </div>
          </div>

          <div className="payment-section payment-notes">
            <h3>Papildomi klausimai ar pastabos</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Jei turite papildomų klausimų ar pastabų dėl kelionės, parašykite čia..."
            />

            <label className="payment-consent">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              Sutinku su kelionės pirkimo sąlygomis
            </label>
          </div>
        </div>

        <BuySessionSidebar
          trip={trip}
          title="Užsakymo suvestinė"
          routeLabel={`${trip.destinationCountry} · ${travellerCount} keliautojai`}
          dateLabel={formatTripDate(departure.date)}
          selectionSummary={
            extrasTotal > 0
              ? `Papildomos paslaugos: +${formatEuro(extrasTotal)}`
              : "Papildomų paslaugų nepasirinkta"
          }
          totalNote={
            appliedDiscount || appliedVoucher ? (
              <>
                {appliedDiscount && (
                  <div>
                    Nuolaida: {appliedDiscount.code} ({discountLabel})
                  </div>
                )}
                {appliedVoucher && (
                  <div>
                    Kuponas: {appliedVoucher.code} (-{formatEuro(voucherAmount)})
                  </div>
                )}
              </>
            ) : undefined
          }
          formattedTotal={formatEuro(finalTotal)}
          isValid={agreed && !isHoldExpired}
          onContinue={handlePay}
          buttonLabel={`Apmokėti ${formatEuro(finalTotal)}`}
          note={
            isHoldExpired
              ? "Rezervacijos laikas baigėsi — grįžkite ir pasirinkite vietas iš naujo."
              : "Mokėjimo apdorojimas bus pridėtas vėliau."
          }
        >
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

          <div className="payment-coupon">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => {
                setVoucherInput(e.target.value);
                setVoucherError("");
              }}
              placeholder="Dovanų kuponas"
            />
            <button type="button" onClick={handleApplyVoucher}>
              Taikyti
            </button>
          </div>
          {voucherError && <p className="payment-coupon-error">{voucherError}</p>}
        </BuySessionSidebar>
        </div>
      </div>

      <Footer />
    </>
  );
}
