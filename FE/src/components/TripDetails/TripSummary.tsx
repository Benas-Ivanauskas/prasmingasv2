import { IoGlobeOutline, IoCalendarOutline, IoPricetagOutline } from "react-icons/io5";
import type { Departure, Trip } from "../../types/trip";
import {
  getTripTypeLabel,
  getTripAvailability,
  formatTripDate,
  type TripPricing,
} from "../../utils/tripHelpers";
import TripTypeIcon from "./TripTypeIcon";
import "./TripSummary.css";

interface TripSummaryProps {
  trip: Trip;
  departures: Departure[];
  selectedDeparture?: Departure;
  onSelectDeparture: (departureId: string) => void;
  pricing: TripPricing;
}

export default function TripSummary({
  trip,
  departures,
  selectedDeparture,
  onSelectDeparture,
  pricing,
}: TripSummaryProps) {
  return (
    <>
      <h1 className="trip-page-title">{trip.title}</h1>

      <div className="trip-page-meta">
        <span>
          <IoGlobeOutline aria-hidden="true" /> {trip.destinationCountry}
        </span>
        <span className="trip-page-meta-sep">·</span>
        <span>{selectedDeparture?.durationDays ?? 1} dienos</span>
        <span className="trip-page-meta-sep">·</span>
        <span>
          <TripTypeIcon type={trip.tripType} /> {getTripTypeLabel(trip.tripType)}
        </span>
      </div>

      {/* Departure date picker — only meaningful when there's more than one date */}
      {departures.length > 1 && (
        <div className="trip-date-picker">
          <span className="trip-date-picker-label">Išvykimo data:</span>
          <div className="trip-date-options">
            {departures.map((dep) => {
              const avail = getTripAvailability(dep);
              return (
                <button
                  key={dep.id}
                  type="button"
                  className={`trip-date-option ${
                    dep.id === selectedDeparture?.id ? "active" : ""
                  }`}
                  onClick={() => onSelectDeparture(dep.id)}
                  disabled={avail.isSoldOut}
                  title={avail.isSoldOut ? "Vietų nebėra" : undefined}
                >
                  {formatTripDate(dep.date)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="trip-info-row">
        <div className="trip-info-item">
          <IoCalendarOutline aria-hidden="true" />
          <div>
            <span className="trip-info-label">Išvykimas</span>
            <span className="trip-info-value">
              {formatTripDate(selectedDeparture?.date)}
            </span>
          </div>
        </div>

        <div className="trip-info-item">
          <IoPricetagOutline aria-hidden="true" />
          <div>
            <span className="trip-info-label">Kaina</span>
            <span className="trip-info-value">{pricing.formattedFinalPrice}</span>
          </div>
        </div>
      </div>
    </>
  );
}
