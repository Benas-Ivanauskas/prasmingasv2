import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  IoMapOutline,
  IoCallOutline,
  IoPricetagOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoMailOutline,
  IoReceiptOutline,
  IoDocumentTextOutline,
  IoWalletOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import ReservationTimerBanner from "../../components/BuySession/ReservationTimerBanner";
import { confirmHold, lookupDiscountCode, lookupVoucher, createOrder } from "../../api/trips";
import { LEGAL_LINKS } from "../../constants/legalLinks";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import { useCountdown } from "../../hooks/useCountdown";
import {
  getTripPricing,
  getCabinTypeLabel,
  getCabinUnitSize,
  getCabinPricing,
  getBookingBaseTotal,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import type { BookingState } from "./buySessionTypes";
import type { BuySuccessState } from "./BuySuccess";
import "./BuyOneSession.css";
import "./BuyPayment.css";

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
  const navigate = useNavigate();
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
    if (!code) return null;
    const discount = lookupDiscountCode(code);
    return discount ? { code: discount.code, type: discount.type, value: discount.value } : null;
  });
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; value: number } | null>(
    () => {
      const code = paymentExtras?.voucherCode;
      if (!code) return null;
      const voucher = lookupVoucher(code);
      return voucher ? { code: voucher.code, value: voucher.value } : null;
    }
  );
  const [paymentMethod, setPaymentMethod] = useState<"FULL" | "DEPOSIT">("FULL");
  const secondsLeft = useCountdown(booking?.holdExpiresAt);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <NotFound />;
  if (!departure) return <NotFound />;

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
  // Departure opts into a deposit option (admin-set %) — otherwise checkout
  // stays "pay the full total now" exactly as before.
  const depositPercentage = departure.depositPercentage ?? 0;
  const hasDepositOption = depositPercentage > 0;
  const depositAmount = hasDepositOption
    ? Math.round(finalTotal * (depositPercentage / 100) * 100) / 100
    : 0;
  const remainingAmount = finalTotal - depositAmount;
  const payingDeposit = hasDepositOption && paymentMethod === "DEPOSIT";
  const amountDueNow = payingDeposit ? depositAmount : finalTotal;
  // Finally gives remainingPaymentDays (admin-set, previously unused) real
  // purpose — only relevant once a deposit (not the full total) is paid now.
  const remainingDueDate =
    payingDeposit && departure.remainingPaymentDays
      ? formatTripDate(
          new Date(
            new Date(departure.date).getTime() -
              departure.remainingPaymentDays * 24 * 60 * 60 * 1000
          ).toISOString()
        )
      : undefined;
  // Cruise prices by cabin, with no traveller-to-cabin mapping collected —
  // shown as a one-time breakdown instead of a (misleading) per-traveller price.
  const cabinBreakdown = isCruise
    ? (departure.cabinTypes ?? [])
        .filter((c) => (booking.cabinSelections?.[c.id] ?? 0) > 0)
        .map((c) => {
          const qty = booking.cabinSelections?.[c.id] ?? 0;
          const capacity = getCabinUnitSize(c.type);
          return {
            id: c.id,
            label: getCabinTypeLabel(c.type),
            qty,
            totalPrice: qty * capacity * getCabinPricing(c).finalPrice,
          };
        })
    : [];
  // CRUISE prices by cabin (shown above), so a per-traveller price badge
  // would be misleading there — FLIGHT/BUS always show it.
  const showPriceColumn = !isCruise;

  const handleApplyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    const discount = lookupDiscountCode(code);
    if (discount) {
      setAppliedDiscount({ code: discount.code, type: discount.type, value: discount.value });
      setDiscountError("");
    } else {
      setAppliedDiscount(null);
      setDiscountError("Nuolaidos kodas neegzistuoja arba nebegalioja.");
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const voucher = lookupVoucher(code);
    if (voucher) {
      setAppliedVoucher({ code: voucher.code, value: voucher.value });
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

  const handlePay = async () => {
    if (isHoldExpired) return;
    // Turns the held seats permanent (TAKEN) instead of leaving them to
    // expire — the swap point for a real "confirm order" endpoint later.
    if (booking.holdId) {
      confirmHold(booking.holdId);
    }

    const firstTraveller = booking.travellers[0];
    const order = await createOrder({
      tripId: trip.id,
      departureId: departure.id,
      tripTitle: trip.title,
      clientName: firstTraveller
        ? `${firstTraveller.firstName} ${firstTraveller.lastName}`.trim()
        : booking.contact.email,
      phone: booking.contact.phone,
      email: booking.contact.email,
      note: comment || undefined,
      travellerCount,
      seatIds: booking.selectedSeatIds,
      totalAmount: finalTotal,
      depositAmount: payingDeposit ? depositAmount : undefined,
      paymentStatus: payingDeposit ? "DEPOSIT_PAID" : "FULLY_PAID",
      createdByAdmin: false,
    });

    const successState: BuySuccessState = {
      orderNumber: order.orderNumber,
      email: booking.contact.email,
      travellerCount,
      seatNumbers: booking.seatNumbers,
      pickupCity: booking.contact.pickupCity || undefined,
      paymentStatus: order.paymentStatus,
      depositAmount: payingDeposit ? depositAmount : undefined,
      remainingAmount: payingDeposit ? remainingAmount : undefined,
      remainingDueDate,
    };
    navigate(`/buy/${trip.slug}/${departure.id}/success`, {
      state: successState,
      replace: true,
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

          {hasDepositOption && (
            <div className="payment-section">
              <div className="payment-section-label">
                <IoWalletOutline aria-hidden="true" />
                Apmokėjimo būdas
              </div>
              <div className="payment-method-options">
                <label className={`payment-method-option ${!payingDeposit ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "FULL"}
                    onChange={() => setPaymentMethod("FULL")}
                  />
                  <span className="payment-method-option-text">
                    <span className="payment-method-option-title">
                      Mokėti visą sumą ({formatEuro(finalTotal)})
                    </span>
                  </span>
                </label>
                <label className={`payment-method-option ${payingDeposit ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "DEPOSIT"}
                    onChange={() => setPaymentMethod("DEPOSIT")}
                  />
                  <span className="payment-method-option-text">
                    <span className="payment-method-option-title">
                      Mokėti depozitą ({formatEuro(depositAmount)})
                    </span>
                    <span className="payment-method-option-sub">
                      Liks sumokėti {formatEuro(remainingAmount)}
                      {remainingDueDate ? ` iki ${remainingDueDate}` : ""}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="payment-section">
            <div className="payment-totals">
              <span>Viso keliautojų: {travellerCount}</span>
              <span>Viso: {formatEuro(finalTotal)}</span>
            </div>
            {payingDeposit && (
              <p className="payment-deposit-note">
                Šiandien mokate {formatEuro(depositAmount)}, likusius{" "}
                {formatEuro(remainingAmount)}
                {remainingDueDate ? ` reikės sumokėti iki ${remainingDueDate}` : " sumokėsite vėliau"}.
              </p>
            )}
          </div>

          <div className="payment-section payment-notes">
            <h3>Papildomi klausimai ar pastabos</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Jei turite papildomų klausimų ar pastabų dėl kelionės, parašykite čia..."
            />

            <a
              href={LEGAL_LINKS.tourismTerms}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-terms-link"
            >
              <IoDocumentTextOutline aria-hidden="true" />
              ORGANIZUOTOS TURISTINĖS KELIONĖS SUTARTIES SĄLYGOS
            </a>

            <label className="payment-consent">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                Susipažinau ir sutinku su{" "}
                <a
                  href={LEGAL_LINKS.tourismTerms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payment-consent-link"
                >
                  organizuotos turistinės kelionės sutarties sąlygomis
                </a>
              </span>
            </label>
          </div>
        </div>

        <BuySessionSidebar
          trip={trip}
          title="Užsakymo suvestinė"
          routeLabel={`${trip.destinationCountry} · ${travellerCount} keliautojai`}
          dateLabel={formatTripDate(departure.date)}
          totalNote={
            appliedDiscount || appliedVoucher || payingDeposit ? (
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
                {payingDeposit && (
                  <div>
                    Depozitas — liks sumokėti {formatEuro(remainingAmount)}
                    {remainingDueDate ? ` iki ${remainingDueDate}` : ""}
                  </div>
                )}
              </>
            ) : undefined
          }
          formattedTotal={formatEuro(amountDueNow)}
          isValid={agreed && !isHoldExpired}
          onContinue={handlePay}
          buttonLabel={`Apmokėti ${formatEuro(amountDueNow)}`}
          note={
            isHoldExpired
              ? "Rezervacijos laikas baigėsi — grįžkite ir pasirinkite vietas iš naujo."
              : "Apmokėjimas bus vykdomas per Paysera saugią mokėjimo sistemą."
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
