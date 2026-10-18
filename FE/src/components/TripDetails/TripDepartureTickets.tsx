import { useNavigate } from "react-router-dom";
import { IoGlobeOutline, IoCalendarOutline } from "react-icons/io5";
import type { Departure, Trip } from "../../types/trip";
import {
  getTripTypeLabel,
  getTripPricing,
  getTripAvailability,
  formatTripDate,
} from "../../utils/tripHelpers";
import TripTypeIcon from "./TripTypeIcon";
import "./TripDepartureTickets.css";

interface TripDepartureTicketsProps {
  trip: Trip;
  departures: Departure[];
}

// Shared by both the embedded list at the end of "Kelionės programa" and
// the dedicated "Pirkti bilietą" tab — one component, rendered twice, so
// the two never drift out of sync with each other. Clicking a card jumps
// straight into the buy session for that exact departure.
export default function TripDepartureTickets({ trip, departures }: TripDepartureTicketsProps) {
  const navigate = useNavigate();

  return (
    <div className="trip-ticket-list">
      {departures.map((departure) => {
        const pricing = getTripPricing(departure);
        const availability = getTripAvailability(departure);

        return (
          <button
            key={departure.id}
            type="button"
            className="trip-ticket-card"
            disabled={availability.isSoldOut}
            title={availability.isSoldOut ? "Vietų nebėra" : undefined}
            onClick={() => navigate(`/buy/${trip.slug}/${departure.id}`)}
          >
            <div className="trip-ticket-info">
              <span className="trip-ticket-date">
                <IoCalendarOutline aria-hidden="true" />
                {formatTripDate(departure.date)}
              </span>
              <span className="trip-ticket-meta">
                <IoGlobeOutline aria-hidden="true" />
                {trip.destinationCountry} · {departure.durationDays} dienos
                <TripTypeIcon type={trip.tripType} /> {getTripTypeLabel(trip.tripType)}
              </span>
              <span
                className={`trip-ticket-availability ${availability.isSoldOut ? "sold-out" : ""}`}
              >
                {availability.text}
                {availability.isGuaranteed && (
                  <span className="trip-ticket-guarantee">Garantuotas išvykimas</span>
                )}
              </span>
            </div>

            <div className="trip-ticket-price-action">
              <div className="trip-ticket-price">
                {pricing.hasDiscount && (
                  <>
                    <del className="trip-ticket-price-original">{pricing.formattedOriginalPrice}</del>
                    <span className="trip-ticket-discount">-{pricing.discount}%</span>
                  </>
                )}
                <span className="trip-ticket-price-value">{pricing.formattedFinalPrice}</span>
              </div>
              <span className="trip-ticket-action">Pirkti</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
