import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  IoCheckmark,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoMailOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import "./BuySuccess.css";

// What Step 4 hands over after a successful "Apmokėti". With a real backend
// this is replaced by the confirmed order fetched via the payment provider's
// return URL (order id in the query), not router state.
export interface BuySuccessState {
  orderNumber: string;
  email: string;
  travellerCount: number;
  seatNumbers: string[];
  pickupCity?: string;
}

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

export default function BuySuccess() {
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const location = useLocation();
  const order = (location.state as BuySuccessState | null) ?? null;
  const { trip, departure, status } = useTripBySlug(slug, departureId);

  // Opened directly (no order handed over) — nothing to confirm.
  if (!order) return <Navigate to="/" replace />;

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip || !departure) return <StatusPage message="Kelionė nerasta." />;

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
