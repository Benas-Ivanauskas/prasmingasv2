import React, { useState } from "react";
import {
  IoBus,
  IoAirplane,
  IoBoat,
  IoGlobeOutline,
  IoChevronDown,
  IoChevronUp,
} from "react-icons/io5";
import type { Trip, TripType } from "../../types/trip";
import {
  getTripDepartures,
  getTripPricing,
  getTripAvailability,
  formatTripDate,
} from "../../utils/tripHelpers";
import "./TripCard.css";

interface TripCardProps {
  trip: Trip;
  /** Departure to show as this card's main/collapsed date; defaults to the earliest one. */
  mainDepartureId?: string;
  onClick?: (trip: Trip) => void;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

function renderTypeIcon(type: TripType) {
  switch (type) {
    case "FLIGHT":
      return <IoAirplane aria-hidden="true" />;
    case "CRUISE":
      return <IoBoat aria-hidden="true" />;
    case "BUS":
    default:
      return <IoBus aria-hidden="true" />;
  }
}

export default function TripCard({ trip, mainDepartureId, onClick, className = "", isExpanded = false, onToggleExpand }: TripCardProps) {
  const [imgSrc, setImgSrc] = useState(
    trip.images && trip.images.length > 0 ? trip.images[0].url : FALLBACK_IMAGE
  );
  // Expansion state is controlled by parent via isExpanded/onToggleExpand props

  const departures = getTripDepartures(trip);
  const mainDeparture = departures.find((d) => d.id === mainDepartureId) ?? departures[0];
  // Main date always shows first; the rest follow in chronological order.
  const orderedDepartures = mainDeparture
    ? [mainDeparture, ...departures.filter((d) => d.id !== mainDeparture.id)]
    : departures;

  const mainPricing = getTripPricing(mainDeparture);
  const duration = mainDeparture?.durationDays ?? 1;

  const hasMultipleDepartures = departures.length > 1;
  const visibleDepartures = isExpanded || !hasMultipleDepartures
    ? orderedDepartures
    : orderedDepartures.slice(0, 1);

  // Tag highlight logic
  const tagText =
    trip.badgeTag ||
    (trip.badgeTag === ""
      ? ""
      : mainPricing.hasDiscount
      ? "Paskutinė minutė!"
      : mainDeparture?.guaranteedOverride
      ? "Garantuotas išvykimas!"
      : "");

  const handleCardClick = () => {
    if (onClick) {
      onClick(trip);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      className={`trip-card ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${trip.title}, kaina ${mainPricing.formattedFinalPrice}`}
    >
      {/* Media / Image container */}
      <div className="trip-card-media">
        <img
          src={imgSrc}
          alt={trip.images?.[0]?.alt || trip.title}
          className="trip-card-image"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Top-Left Duration Badge (Bus/Plane/Cruise icon + duration) */}
        <div className="trip-card-badge-top">
          {renderTypeIcon(trip.tripType)}
          <span>{duration}d.</span>
        </div>

        {/* Bottom-Left Starting Price Badge ("NUO 55.25 €") */}
        <div className="trip-card-badge-from">
          <span className="badge-label">NUO</span>
          <span className="badge-value">{mainPricing.formattedFinalPrice}</span>
        </div>

        {/* Bottom-Right Discount Badge ("IKI -15%") */}
        {mainPricing.hasDiscount && (
          <div className="trip-card-badge-discount">
            <span className="badge-label">IKI</span>
            <span className="badge-value">-{mainPricing.discount}%</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="trip-card-body">
        <h3 className="trip-card-title" title={trip.title}>
          {trip.title}
        </h3>

        <div className="trip-card-location">
          <IoGlobeOutline aria-hidden="true" />
          <span>{trip.destinationCountry}</span>
        </div>

        {tagText ? <span className="trip-card-tag">{tagText}</span> : null}
      </div>

      {/* Departures Section */}
      <div className="trip-card-departures-wrapper">
        {visibleDepartures.map((dep) => {
          const depPricing = getTripPricing(dep);
          const depAvail = getTripAvailability(dep);
          const formattedDate = formatTripDate(dep.date);

          return (
            <div
              className="trip-departure-row"
              key={dep.id}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`trip-card-date ${dep.id === mainDeparture?.id ? "is-first" : ""}`}>
                {formattedDate}
              </div>

              <div className="trip-card-status">
                <span
                  className={`trip-card-availability ${
                    depAvail.isSoldOut ? "sold-out" : ""
                  }`}
                >
                  {depAvail.text}
                </span>
                {depAvail.isGuaranteed && (
                  <span
                    className="guarantee-badge"
                    title="Garantuotas išvykimas"
                    aria-label="Garantuotas išvykimas"
                  >
                    G
                  </span>
                )}
              </div>

              <div className="trip-card-price-group">
                {depPricing.hasDiscount ? (
                  <>
                    <span className="discount-text">-{depPricing.discount}%</span>
                    <del className="original-strike">
                      {depPricing.formattedFooterOriginal}
                    </del>
                    <span className="final-price">
                      {depPricing.formattedFooterFinal}
                    </span>
                  </>
                ) : (
                  <span className="final-price">
                    {depPricing.formattedFooterFinal}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* "Visos datos" Expand/Collapse Button */}
        {hasMultipleDepartures && (
          <button
            type="button"
            className="trip-card-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Rodyti mažiau datų" : "Rodyti visas datas"}
          >
            <span>visos datos</span>
            {isExpanded ? (
              <IoChevronUp aria-hidden="true" />
            ) : (
              <IoChevronDown aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
