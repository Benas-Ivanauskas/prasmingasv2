import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
} from "react-icons/io5";
import type { Trip, Departure } from "../../types/trip";
import { getScaledImageUrl, getProgramDayPhotos } from "../../utils/tripHelpers";
import TripMemo from "./TripMemo";
import TripReviews from "./TripReviews";
import TripDepartureTickets from "./TripDepartureTickets";
import RichText from "../RichText/RichText";
import { isHtml } from "../RichText/richTextUtils";
import "./TripTabs.css";

export type TripDetailTab = "program" | "tickets" | "pickup" | "memo";

// Caps how many photos show per day before collapsing the rest behind a
// "+N daugiau" overlay (opens the lightbox at that photo either way).
const PROGRAM_DAY_PREVIEW_COUNT = 4;

interface TripTabsProps {
  trip: Trip;
  /** Pickup points shown in the "Išvykimo vietos" tab come from here, same
   *  source TripSummary's info-row summary uses — so both always agree. */
  selectedDeparture?: Departure;
  /** Every departure, for the "Kelionės bilietai" list embedded at the end
   *  of "Kelionės programa" and reused whole as the "Pirkti bilietą" tab. */
  departures: Departure[];
  activeTab: TripDetailTab;
  onTabChange: (tab: TripDetailTab) => void;
  /** Opens the lightbox at the given day's given photo. */
  onOpenProgramImage: (dayIndex: number, photoIndex: number) => void;
}

export default function TripTabs({
  trip,
  selectedDeparture,
  departures,
  activeTab,
  onTabChange,
  onOpenProgramImage,
}: TripTabsProps) {
  const pickupPoints = selectedDeparture?.pickupPoints ?? [];

  // "Išvykimo vietos" only shows up once there are pickup points. "Atmintinė"
  // is always present for every trip type; it shows a placeholder until the
  // admin fills in the memo text.
  const tabs: { id: TripDetailTab; label: string }[] = [
    { id: "program", label: "Kelionės programa" },
    { id: "tickets", label: "Pirkti bilietą" },
    ...(pickupPoints.length > 0 ? [{ id: "pickup" as const, label: "Išvykimo vietos" }] : []),
    { id: "memo", label: "Atmintinė" },
  ];

  return (
    <>
      <div className="trip-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`trip-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="trip-tab-panel">
        {activeTab === "program" && (
          <>
            <div className="trip-overview">
              <h2>Kodėl verta rinktis šią kelionę?</h2>
              <RichText value={trip.description || trip.shortDescription} />
            </div>

            <ol className="trip-program-list trip-program-list-spaced">
              {(trip.programDays ?? []).map((day, dayIndex) => {
                const photos = getProgramDayPhotos(day);
                const visiblePhotos = photos.slice(0, PROGRAM_DAY_PREVIEW_COUNT);
                const hiddenCount = photos.length - visiblePhotos.length;

                return (
                  <li key={day.day} className="trip-program-day">
                    <span className="trip-program-day-number">{day.day} diena</span>
                    <h3>{day.title}</h3>
                    <RichText value={day.description} />

                    {visiblePhotos.length > 0 && (
                      <div className="trip-program-day-photos">
                        {visiblePhotos.map((photo, i) => {
                          const isLastVisible = i === visiblePhotos.length - 1;
                          const showMoreOverlay = isLastVisible && hiddenCount > 0;
                          return (
                            <button
                              key={i}
                              type="button"
                              className="trip-program-day-photo"
                              onClick={() => onOpenProgramImage(dayIndex, i)}
                              aria-label={`${day.title} — nuotrauka ${i + 1}`}
                            >
                              <img
                                src={getScaledImageUrl(photo.url, 400)}
                                alt={photo.alt || day.title}
                              />
                              {showMoreOverlay && (
                                <span className="trip-program-day-more-overlay">
                                  +{hiddenCount} daugiau
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <TripReviews reviews={trip.reviews ?? []} />

            <h3 className="trip-tickets-heading">Kelionės bilietai</h3>
            <TripDepartureTickets trip={trip} departures={departures} />

            <div className="trip-included-grid trip-included-grid-end">
              <div>
                <h3>
                  <IoCheckmarkCircleOutline aria-hidden="true" /> Įskaičiuota
                </h3>
                <RichText value={trip.inclusions} />
              </div>
              <div>
                <h3>
                  <IoCloseCircleOutline aria-hidden="true" /> Neįskaičiuota
                </h3>
                <RichText value={trip.exclusions} />
              </div>
            </div>
          </>
        )}

        {activeTab === "tickets" && (
          <TripDepartureTickets trip={trip} departures={departures} />
        )}

        {activeTab === "pickup" && (
          <ul className="trip-pickup-list">
            {pickupPoints.map((point) => (
              <li key={point.city} className="trip-pickup-row">
                <IoLocationOutline aria-hidden="true" />
                <span className="trip-pickup-city">{point.city}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "memo" &&
          (trip.travellerMemo ? (
            isHtml(trip.travellerMemo) ? (
              <RichText value={trip.travellerMemo} className="trip-memo" />
            ) : (
              <TripMemo text={trip.travellerMemo} />
            )
          ) : (
            <p>Kelionės atmintinė bus paskelbta artimiausiu metu.</p>
          ))}
      </div>
    </>
  );
}
