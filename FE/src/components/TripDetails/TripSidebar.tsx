import { IoGlobeOutline, IoCalendarOutline, IoDownloadOutline } from "react-icons/io5";
import type { Departure, Trip } from "../../types/trip";
import {
  getTripTypeLabel,
  formatTripDate,
  type TripPricing,
  type AvailabilityInfo,
} from "../../utils/tripHelpers";
import { downloadTripProgramPdf } from "../../api/trips";
import TripTypeIcon from "./TripTypeIcon";
import "./TripSidebar.css";

interface TripSidebarProps {
  trip: Trip;
  selectedDeparture?: Departure;
  pricing: TripPricing;
  availability: AvailabilityInfo;
  onSelectTrip?: () => void;
}

export default function TripSidebar({
  trip,
  selectedDeparture,
  pricing,
  availability,
  onSelectTrip,
}: TripSidebarProps) {
  return (
    <aside className="trip-sidebar">
      <div className="trip-sidebar-card">
        <h3>Jūsų kelionė</h3>

        <div className="trip-sidebar-row">
          <IoGlobeOutline aria-hidden="true" />
          {trip.destinationCountry} · {selectedDeparture?.durationDays ?? 1} dienos
        </div>
        <div className="trip-sidebar-row">
          <IoCalendarOutline aria-hidden="true" />
          {formatTripDate(selectedDeparture?.date)}
        </div>
        <div className="trip-sidebar-row">
          <TripTypeIcon type={trip.tripType} />
          {getTripTypeLabel(trip.tripType)}
        </div>
        <div className="trip-sidebar-row">
          <span
            className={`trip-sidebar-availability ${
              availability.isSoldOut ? "sold-out" : ""
            }`}
          >
            {availability.text}
          </span>
          {availability.isGuaranteed && (
            <span className="trip-sidebar-guarantee">Garantuotas išvykimas</span>
          )}
        </div>

        <div className="trip-sidebar-price">
          {pricing.hasDiscount && (
            <del className="trip-sidebar-price-original">
              {pricing.formattedOriginalPrice}
            </del>
          )}
          <span className="trip-sidebar-price-value">{pricing.formattedFinalPrice}</span>
        </div>

        <button
          type="button"
          className="btn-primary trip-cta"
          disabled={availability.isSoldOut || !onSelectTrip}
          onClick={onSelectTrip}
        >
          Rinktis kelionę
        </button>

        <button
          type="button"
          className="trip-pdf-cta"
          onClick={() => downloadTripProgramPdf(trip.id)}
        >
          <IoDownloadOutline aria-hidden="true" />
          Atsisiųsti kelionės programą (PDF)
        </button>
      </div>
    </aside>
  );
}
