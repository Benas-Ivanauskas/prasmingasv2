import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  IoCheckmark,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoMailOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import { fetchOrderById, type OrderStatusResponse } from "../../api/trips";
import { formatEuro } from "../../utils/tripHelpers";
import "./BuySuccess.css";
import "./BuyCancelled.css"; // .cancelled-icon — reused for CANCELLED/EXPIRED here too

const MONTHS_GENITIVE = [
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio",
];

const pad = (n: number) => String(n).padStart(2, "0");

// "03–09 spalio 2026", or "28 spalio – 03 lapkričio 2026" across months.
function formatDateRange(isoDate: string, durationDays: number): string {
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, durationDays) - 1);

  const startDay = pad(start.getDate());
  const endDay = pad(end.getDate());
  const startMonth = MONTHS_GENITIVE[start.getMonth()];
  const endMonth = MONTHS_GENITIVE[end.getMonth()];
  const year = end.getFullYear();

  if (start.getTime() === end.getTime() || startDay === endDay) {
    return `${startDay} ${startMonth} ${year}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

function travellersLabel(count: number): string {
  if (count === 1) return "1 keleivis";
  if (count % 10 === 0 || (count >= 11 && count <= 19)) return `${count} keleivių`;
  return `${count} keleiviai`;
}

// accepturl kelias atgalia tikrą naršyklės redirect'ą (ne react-router
// navigate), tad orderId ateina iš URL query, ne router state — tai jau
// dingsta tokio tipo navigacijoje.
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

export default function BuySuccess() {
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { trip, departure, status } = useTripBySlug(slug, departureId);

  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Liko PENDING_PAYMENT net po kelių bandymų — webhook'as dar nespėjo (arba,
  // lokalioje dev aplinkoje, niekad nespės, nes Paysera nepasiekia
  // localhost — žr. BACKEND_IMPLEMENTATION_PLAN.md Fazė 6).
  const [stillPending, setStillPending] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempt = 0;

    const poll = async () => {
      const result = await fetchOrderById(orderId);
      if (cancelled) return;
      if (!result) {
        setNotFound(true);
        return;
      }
      if (result.status === "PENDING_PAYMENT" && attempt < MAX_POLL_ATTEMPTS) {
        attempt += 1;
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }
      setOrder(result);
      setStillPending(result.status === "PENDING_PAYMENT");
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Atidaryta tiesiogiai, be orderId — nėra ko patvirtinti.
  if (!orderId) return <Navigate to="/" replace />;
  if (notFound) return <NotFound />;

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip || !departure) return <NotFound />;

  if (!order) {
    return <StatusPage message="Tikriname mokėjimo būseną..." />;
  }

  if (stillPending) {
    return (
      <>
        <Header />
        <section className="success-page">
          <div className="container">
            <div className="success-card">
              <div className="success-icon" aria-hidden="true">
                <IoTimeOutline />
              </div>
              <h1 className="success-title">Laukiame mokėjimo patvirtinimo</h1>
              <p className="success-text">
                Užsakymas <strong>{order.orderNumber}</strong> gautas, bet mokėjimo patvirtinimas
                iš Paysera dar neatkeliavo. Tai gali užtrukti kelias minutes — patvirtinimą
                atsiųsime el. paštu {order.email}, kai tik gausime.
              </p>
              <Link to="/" className="btn-primary success-cta">
                Grįžti į pagrindinį
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (order.status === "CANCELLED" || order.status === "EXPIRED") {
    return (
      <>
        <Header />
        <section className="success-page">
          <div className="container">
            <div className="success-card">
              <div className="success-icon cancelled-icon" aria-hidden="true">
                <IoCloseCircleOutline />
              </div>
              <h1 className="success-title">Užsakymas neapmokėtas</h1>
              <p className="success-text">
                Užsakymas <strong>{order.orderNumber}</strong> buvo atšauktas arba pasibaigė jo
                galiojimo laikas.
              </p>
              <Link to={`/buy/${trip.slug}/${departure.id}`} className="btn-primary success-cta">
                ← Pasirinkti vietas iš naujo
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const placeParts = [
    order.pickupCity,
    order.seatNumbers.length > 0 ? `vietos ${order.seatNumbers.join(", ")}` : null,
  ].filter(Boolean);

  return (
    <>
      <Header />

      <section className="success-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon" aria-hidden="true">
              <IoCheckmark />
            </div>

            <h1 className="success-title">Kelionė užsakyta!</h1>
            <p className="success-text">
              Ačiū! Jūsų kelionė į {trip.destinationCountry} jau rezervuota.
            </p>

            <div className="success-details">
              <div className="success-detail">
                <IoCalendarOutline aria-hidden="true" />
                <span>{formatDateRange(departure.date, departure.durationDays)}</span>
              </div>
              <div className="success-detail">
                <IoPeopleOutline aria-hidden="true" />
                <span>{travellersLabel(order.travellerCount)}</span>
              </div>
              {placeParts.length > 0 && (
                <div className="success-detail">
                  <IoLocationOutline aria-hidden="true" />
                  <span>{placeParts.join(" · ")}</span>
                </div>
              )}
            </div>

            <div className="success-order">
              <span className="success-order-label">Užsakymo numeris</span>
              <span className="success-order-number">{order.orderNumber}</span>
            </div>

            {order.status === "DEPOSIT_PAID" && (
              <p className="success-text">
                Sumokėjote depozitą {formatEuro(order.depositAmount ?? 0)}. Likusią sumą{" "}
                {formatEuro(order.remainingAmount ?? 0)}
                {order.remainingDueDate
                  ? ` — mokėjimo nuorodą atsiųsime el. paštu ${order.remainingDueDate} dieną`
                  : " sumokėsite vėliau"}
                .
              </p>
            )}

            <Link to="/" className="btn-primary success-cta">
              Grįžti į pagrindinį
            </Link>

            <p className="success-email">
              <IoMailOutline aria-hidden="true" />
              Patvirtinimą išsiuntėme į {order.email}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
