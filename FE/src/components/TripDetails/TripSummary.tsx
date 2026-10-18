import { IoGlobeOutline, IoCalendarOutline, IoPricetagOutline } from "react-icons/io5";
import type { Departure, Trip } from "../../types/trip";
import { getTripTypeLabel, formatTripDate, type TripPricing } from "../../utils/tripHelpers";
import TripTypeIcon from "./TripTypeIcon";
import "./TripSummary.css";

interface TripSummaryProps {
  trip: Trip;
  selectedDeparture?: Departure;
  pricing: TripPricing;
}

export default function TripSummary({ trip, selectedDeparture, pricing }: TripSummaryProps) {
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
