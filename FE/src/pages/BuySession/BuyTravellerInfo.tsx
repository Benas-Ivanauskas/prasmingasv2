import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IoDocumentTextOutline, IoDownloadOutline } from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
import BuyStepper from "../../components/BuySession/BuyStepper";
import BuySessionSidebar from "../../components/BuySession/BuySessionSidebar";
import ReservationTimerBanner from "../../components/BuySession/ReservationTimerBanner";
import TravellerFields from "../../components/BuySession/TravellerFields";
import { downloadConsentDocument, lookupDiscountCode } from "../../api/trips";
import type { DiscountValidation } from "../../types/discount";
import {
  formatLtPhone,
  getEmailError,
  isValidEmail,
  isValidLtPhone,
  PHONE_PREFIX,
  stripSpaces,
} from "../../utils/validation";
import { LEGAL_LINKS } from "../../constants/legalLinks";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import { useCountdown } from "../../hooks/useCountdown";
import {
  getTripPricing,
  getCabinTypeLabel,
  getCabinUnitSize,
  getCabinPricing,
  getBookingBaseTotal,
  getCheckoutTotals,
  formatTripDate,
  formatEuro,
} from "../../utils/tripHelpers";
import type {
  TravellerForm,
  ContactForm,
  ConsentForm,
  BookingState,
  SeatSelectionState,
} from "./buySessionTypes";
import "./BuyOneSession.css";
import "./BuyTravellerInfo.css";

type ConsentDocument = {
  key: keyof ConsentForm;
  documentKey: string;
  // Hosted page opened in a new tab; documents without one yet fall back to
  // the downloadConsentDocument stub.
  url?: string;
  linkText: string;
  before: string;
  after: string;
};

// BUS and CRUISE use these; FLIGHT adds AIR_CARRIAGE_CONSENT on top.
const CONSENT_DOCUMENTS: ConsentDocument[] = [
  {
    key: "agreedInfoForm",
    documentKey: "info-form",
    url: LEGAL_LINKS.infoForm,
    linkText: "Standartinės informacijos teikimo forma",
    before: "Susipažinau ir sutinku su ",
    after:
      ", kai sudaroma organizuotos turistinės kelionės sutartis su kelionių organizatoriumi VšĮ „Prasmingam gyvenimui“.",
  },
  {
    key: "agreedPrivacyPolicy",
    documentKey: "privacy-policy",
    url: LEGAL_LINKS.privacyPolicy,
    linkText: "Privatumo politika",
    before: "Patvirtinu, kad susipažinau su įmonės ",
    after:
      ", kurioje aptartas asmens duomenų tvarkymas ir apsauga bei mano teisės ir jų įgyvendinimo tvarka.",
  },
  {
    // url nustatomas dinamiškai komponente (žr. consentDocuments žemiau) —
    // ŠIS dokumentas generuojamas PER KONKREČIĄ kelionę/išvykimą (BE
    // Puppeteer, travellerMemo.service.ts), ne statinis failas kaip likę trys.
    key: "agreedTravellerMemo",
    documentKey: "traveller-memo",
    linkText: "Keliautojo atmintinė",
    before: "Susipažinau su ",
    after: ".",
  },
];

const AIR_CARRIAGE_CONSENT: ConsentDocument = {
  key: "agreedAirCarriage",
  documentKey: "air-carriage-conditions",
  url: LEGAL_LINKS.airCarriageConditions,
  linkText: "pagrindinėmis vežimo oru sąlygomis",
  before: "Susipažinau ir sutinku su ",
  after: ".",
};

const emptyTraveller = (): TravellerForm => ({
  firstName: "",
  lastName: "",
  birthDate: "",
  personalCode: "",
  passportNumber: "",
  passportExpiry: "",
});

export default function BuyTravellerInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const [searchParams] = useSearchParams();
  const travellerCount = Math.max(1, Number(searchParams.get("count")) || 1);
  const incomingState = location.state as SeatSelectionState | BookingState | null;
  const seatSelection: SeatSelectionState = incomingState ?? { seatNumbers: [] };
  // Arriving via Step 4's "← Atgal" link hands back the full BookingState
  // (contact + travellers already filled in) instead of just the seat
  // selection Step 2 sends forward — restore from it when present.
  const restoredBooking =
    incomingState && "travellers" in incomingState ? incomingState : null;

  const { trip, departure, status } = useTripBySlug(slug, departureId);
  const secondsLeft = useCountdown(seatSelection.holdExpiresAt);
  const hasHold = Boolean(seatSelection.holdExpiresAt);
  const isHoldExpired = hasHold && secondsLeft <= 0;
  const [travellers, setTravellers] = useState<TravellerForm[]>(
    () => restoredBooking?.travellers ?? Array.from({ length: travellerCount }, emptyTraveller)
  );
  const [contact, setContact] = useState<ContactForm>(
    () =>
      restoredBooking?.contact ?? {
        email: "",
        phone: PHONE_PREFIX,
        city: "",
        pickupCity: "",
        wantsInvoice: seatSelection.wantsInvoice ?? false,
        companyName: seatSelection.companyName,
        companyDetails: seatSelection.companyDetails,
      }
  );
  // One set of selected extras per traveller — extras like baggage are
  // picked per person, not once for the whole booking.
  const [travellerExtraIds, setTravellerExtraIds] = useState<Set<string>[]>(() =>
    restoredBooking
      ? restoredBooking.travellers.map((t) => new Set(t.extraIds))
      : Array.from({ length: travellerCount }, () => new Set<string>())
  );
  const [touched, setTouched] = useState({ email: false, phone: false });
  const [consents, setConsents] = useState<ConsentForm>(
    () =>
      restoredBooking?.consents ?? {
        agreedInfoForm: false,
        agreedPrivacyPolicy: false,
        agreedTravellerMemo: false,
        agreedAirCarriage: false,
      }
  );
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (seatSelection.discountCode) {
      lookupDiscountCode(seatSelection.discountCode).then((d) => {
        if (!cancelled) setAppliedDiscount(d ?? null);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [seatSelection.discountCode]);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <NotFound />;
  if (!departure) return <NotFound />;

  const pricing = getTripPricing(departure);
  const isFlight = trip.tripType === "FLIGHT";
  const isCruise = trip.tripType === "CRUISE";
  const memoUrl = `${API_URL}/api/trips/${trip.slug}/departures/${departure.id}/memo.pdf`;
  const consentDocuments = (isFlight ? [...CONSENT_DOCUMENTS, AIR_CARRIAGE_CONSENT] : CONSENT_DOCUMENTS).map((doc) =>
    doc.key === "agreedTravellerMemo" ? { ...doc, url: memoUrl } : doc,
  );
  const pickupPoints = departure.pickupPoints ?? [];
  // Cruise pricing is per cabin type, not a flat per-person departure cost —
  // a per-traveller price only makes sense for BUS/FLIGHT, so cruises get a
  // one-time cabin breakdown instead (there's no traveller-to-cabin mapping).
  const cabinBreakdown = isCruise
    ? (departure.cabinTypes ?? [])
        .filter((c) => (seatSelection.cabinSelections?.[c.id] ?? 0) > 0)
        .map((c) => {
          const qty = seatSelection.cabinSelections?.[c.id] ?? 0;
          const capacity = getCabinUnitSize(c.type);
          return {
            id: c.id,
            label: getCabinTypeLabel(c.type),
            qty,
            // qty counts units (places for QUAD, cabins otherwise) — each
            // covers `capacity` travellers paying the discounted price.
            totalPrice: qty * capacity * getCabinPricing(c).finalPrice,
          };
        })
    : [];
  // Admin-defined per-trip add-ons (meals, tickets, baggage, etc.) — not a
  // hardcoded list, so whatever the trip was created with just shows up here.
  const extras = departure.extraOptions ?? [];

  const updateTraveller = (index: number, field: keyof TravellerForm, value: string) => {
    setTravellers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const toggleExtra = (travellerIndex: number, extraId: string) => {
    setTravellerExtraIds((prev) =>
      prev.map((ids, i) => {
        if (i !== travellerIndex) return ids;
        const next = new Set(ids);
        if (next.has(extraId)) next.delete(extraId);
        else next.add(extraId);
        return next;
      })
    );
  };

  const isValid =
    consents.agreedInfoForm &&
    consents.agreedPrivacyPolicy &&
    consents.agreedTravellerMemo &&
    (!isFlight || consents.agreedAirCarriage) &&
    isValidEmail(contact.email) &&
    isValidLtPhone(contact.phone) &&
    contact.city.trim() &&
    (pickupPoints.length === 0 || contact.pickupCity.trim()) &&
    travellers.every(
      (t) =>
        t.firstName.trim() &&
        t.lastName.trim() &&
        t.birthDate.trim() &&
        (!isFlight || (t.passportNumber.trim() && t.passportExpiry.trim()))
    );

  const baseTotal = getBookingBaseTotal(
    trip,
    departure,
    travellerCount,
    seatSelection.cabinSelections
  );
  const extrasTotal = travellerExtraIds.reduce(
    (sum, ids) =>
      sum + extras.filter((e) => ids.has(e.id)).reduce((s, e) => s + e.price, 0),
    0
  );
  const grandTotal = baseTotal + extrasTotal;
  const selectedExtrasCount = travellerExtraIds.reduce((sum, ids) => sum + ids.size, 0);

  // The discount code and deposit choice were decided in Step 1 — applied
  // here too (resolved async above, in the appliedDiscount state),
  // recomputed against the CURRENT grand total (base + whichever extras are
  // picked right now), so picking an extra never just tacks its price onto
  // an already-fixed deposit figure.
  const { payingDeposit, amountDueNow, remainingAmount, remainingDueDate } = getCheckoutTotals(
    grandTotal,
    departure,
    appliedDiscount,
    seatSelection.wantsDeposit
  );

  const handleContinue = () => {
    const bookingState: BookingState = {
      ...seatSelection,
      contact,
      travellers: travellers.map((t, i) => ({
        ...t,
        extraIds: Array.from(travellerExtraIds[i]),
      })),
      consents,
      // Forwarded untouched when set — only present if we got here via
      // Step 4's "← Atgal" link, so going forward again restores Step 4's
      // own fields (comment, consent, applied code) instead of resetting them.
      paymentExtras: restoredBooking?.paymentExtras,
    };
    navigate(`/buy/${trip.slug}/${departure.id}/payment`, { state: bookingState });
  };

  return (
    <>
      <Header />

      <div className="container">
        <BuyStepper currentStep={3} />
        <Link
          to={`/buy/${trip.slug}/${departure.id}/seats`}
          state={seatSelection}
          className="buy-session-back-link"
        >
          ← Grįžti į vietų pasirinkimą
        </Link>
        <h1 className="buy-session-title">Keleivių duomenys</h1>
        <p className="buy-session-subtitle">Užpildykite kiekvieno keliautojo duomenis</p>

      {/* The sidebar is a sibling of the content here (not of the header
          block above), so its top edge lines up with the reservation
          banner/cards instead of the stepper/title. */}
      <div className="buy-session-body">
        <div className="buy-session-main">
          <ReservationTimerBanner
            holdExpiresAt={seatSelection.holdExpiresAt}
            secondsLeft={secondsLeft}
            restartUrl={`/buy/${trip.slug}/${departure.id}`}
          />

          <div className="traveller-card">
            <h3>
              <IoDocumentTextOutline aria-hidden="true" />
              Sutikimai ir taisyklės
            </h3>
            {consentDocuments.map((doc) => (
              <label key={doc.key} className="traveller-consent-row">
                <input
                  type="checkbox"
                  checked={Boolean(consents[doc.key])}
                  onChange={(e) =>
                    setConsents((prev) => ({ ...prev, [doc.key]: e.target.checked }))
                  }
                />
                <span>
                  {doc.before}
                  {/* "Keliautojo atmintinė" sąmoningai NIEKADA nerodoma kaip
                      pabraukta nuoroda — tik "Atsisiųsti" veikia (naudoja tą
                      patį doc.url). Likiems trims (statiniams PDF) tekstas
                      lieka nuoroda, kaip ir anksčiau. */}
                  {doc.url && doc.key !== "agreedTravellerMemo" ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="traveller-consent-link"
                    >
                      {doc.linkText}
                    </a>
                  ) : (
                    <strong>{doc.linkText}</strong>
                  )}
                  {doc.after}{" "}
                  <button
                    type="button"
                    className="traveller-consent-download"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
                      else downloadConsentDocument(doc.documentKey);
                    }}
                  >
                    <IoDownloadOutline aria-hidden="true" />
                    Atsisiųsti
                  </button>
                </span>
              </label>
            ))}
          </div>

          <div className="traveller-card">
            <h3>Kontaktinė informacija</h3>
            <div className="traveller-fields">
              <label>
                El. paštas *
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={contact.email}
                  aria-invalid={touched.email && !isValidEmail(contact.email)}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, email: stripSpaces(e.target.value) }))
                  }
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                />
                {touched.email && getEmailError(contact.email) && (
                  <span className="traveller-field-error">{getEmailError(contact.email)}</span>
                )}
              </label>
              <label>
                Telefonas *
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+370 6xx xxxxx"
                  value={contact.phone}
                  aria-invalid={touched.phone && !isValidLtPhone(contact.phone)}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, phone: formatLtPhone(e.target.value) }))
                  }
                  onFocus={(e) => {
                    // Caret always lands after the fixed prefix.
                    const end = e.target.value.length;
                    requestAnimationFrame(() => e.target.setSelectionRange(end, end));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                />
                {touched.phone && !isValidLtPhone(contact.phone) && (
                  <span className="traveller-field-error">
                    Įveskite pilną numerį, pvz. +370 612 34567
                  </span>
                )}
              </label>
              <label>
                Miestas *
                <input
                  type="text"
                  value={contact.city}
                  onChange={(e) => setContact((prev) => ({ ...prev, city: e.target.value }))}
                />
              </label>
            </div>

            {pickupPoints.length > 0 && (
              <label className="traveller-pickup">
                Išvykimo vieta *
                <select
                  value={contact.pickupCity}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, pickupCity: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    Pasirinkite išvykimo vietą
                  </option>
                  {pickupPoints.map((point) => (
                    <option key={point.city} value={point.city}>
                      {point.city}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {cabinBreakdown.length > 0 && (
            <div className="traveller-card">
              <h3>Pasirinktos kajutės</h3>
              {cabinBreakdown.map((c) => (
                <div key={c.id} className="traveller-price-row">
                  <span className="traveller-price-label">
                    {c.qty} × {c.label}
                  </span>
                  <span className="traveller-price-final">
                    {formatEuro(c.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {travellers.map((traveller, index) => (
            <TravellerFields
              key={index}
              index={index}
              traveller={traveller}
              isFlight={isFlight}
              onChange={(field, value) => updateTraveller(index, field, value)}
              seatLabel={seatSelection.seatNumbers[index]}
              headerExtra={
                !isCruise && (
                  <div className="traveller-price-row">
                    <span className="traveller-price-label">Kaina</span>
                    {pricing.hasDiscount && (
                      <del className="traveller-price-original">
                        {pricing.formattedOriginalPrice}
                      </del>
                    )}
                    <span className="traveller-price-final">{pricing.formattedFinalPrice}</span>
                    {pricing.hasDiscount && (
                      <span className="traveller-price-discount">-{pricing.discount}%</span>
                    )}
                  </div>
                )
              }
            >
              {extras.length > 0 && (
                <div className="traveller-extras">
                  <span className="traveller-extras-label">Papildomos paslaugos</span>
                  {extras.map((extra) => (
                    <label key={extra.id} className="traveller-extra-row">
                      <input
                        type="checkbox"
                        checked={travellerExtraIds[index].has(extra.id)}
                        onChange={() => toggleExtra(index, extra.id)}
                      />
                      <span className="traveller-extra-name">{extra.name}</span>
                      <span className="traveller-extra-price">+{formatEuro(extra.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </TravellerFields>
          ))}
        </div>

        <BuySessionSidebar
          trip={trip}
          title="Užsakymo suvestinė"
          routeLabel={`${trip.destinationCountry} · ${travellerCount} keliautojai`}
          dateLabel={formatTripDate(departure.date)}
          selectionSummary={
            selectedExtrasCount > 0
              ? `Pasirinkta papildomų paslaugų: ${selectedExtrasCount}`
              : "Papildomų paslaugų nepasirinkta"
          }
          formattedTotal={formatEuro(amountDueNow)}
          totalNote={
            payingDeposit
              ? `Depozitas — liks sumokėti ${formatEuro(remainingAmount)}${
                  remainingDueDate
                    ? ` — ${remainingDueDate} dieną atsiųsime mokėjimo nuorodą el. paštu`
                    : ""
                }`
              : undefined
          }
          isValid={Boolean(isValid) && !isHoldExpired}
          onContinue={handleContinue}
          note={
            isHoldExpired
              ? "Rezervacijos laikas baigėsi — pradėkite iš naujo."
              : undefined
          }
        />
      </div>
      </div>

      <Footer />
    </>
  );
}
