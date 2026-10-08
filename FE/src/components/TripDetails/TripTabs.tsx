import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
} from "react-icons/io5";
import type { Trip, Departure } from "../../types/trip";
import { getScaledImageUrl, getProgramDayPhotos } from "../../utils/tripHelpers";
import TripGallery from "./TripGallery";
import TripMemo from "./TripMemo";
import "./TripTabs.css";

export type TripDetailTab = "overview" | "program" | "pickup" | "included" | "memo";

// Same cap TripGallery.tsx uses for Apžvalga — keeps the "too many photos"
// treatment ("+N daugiau" overlay) consistent across both tabs.
const PROGRAM_DAY_PREVIEW_COUNT = 4;

interface TripTabsProps {
  trip: Trip;
  /** Pickup points shown in the "Išvykimo vietos" tab come from here, same
   *  source TripSummary's info-row summary uses — so both always agree. */
  selectedDeparture?: Departure;
  activeTab: TripDetailTab;
  onTabChange: (tab: TripDetailTab) => void;
  /** Opens the lightbox at this index within the trip's full image list. */
  onOpenGalleryImage: (fullImageIndex: number) => void;
  /** Opens the lightbox at the given day's given photo. */
  onOpenProgramImage: (dayIndex: number, photoIndex: number) => void;
}

export default function TripTabs({
  trip,
  selectedDeparture,
  activeTab,
  onTabChange,
  onOpenGalleryImage,
  onOpenProgramImage,
}: TripTabsProps) {
  // Gallery excludes the hero (index 0, already shown above the fold).
  const galleryImages = trip.images.slice(1);
  const pickupPoints = selectedDeparture?.pickupPoints ?? [];

  // "Išvykimo vietos" only shows up once there are pickup points. "Atmintinė"
  // is always present for every trip type; it shows a placeholder until the
  // admin fills in the memo text.
  const tabs: { id: TripDetailTab; label: string }[] = [
    { id: "overview", label: "Apžvalga" },
    { id: "program", label: "Programa" },
    ...(pickupPoints.length > 0 ? [{ id: "pickup" as const, label: "Išvykimo vietos" }] : []),
    { id: "included", label: "Įskaičiuota" },
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
        {activeTab === "overview" && (
          <div className="trip-overview">
            <h2>Kodėl verta rinktis šią kelionę?</h2>
            <p>{trip.description || trip.shortDescription}</p>

            <TripGallery
              images={galleryImages}
              fallbackAlt={trip.title}
              // +1 to map back onto the index within trip.images, since the
              // hero (index 0) was excluded above.
              onOpen={(idx) => onOpenGalleryImage(idx + 1)}
            />
          </div>
        )}

        {activeTab === "program" && (
          <ol className="trip-program-list">
            {(trip.programDays ?? []).map((day, dayIndex) => {
              const photos = getProgramDayPhotos(day);
              const visiblePhotos = photos.slice(0, PROGRAM_DAY_PREVIEW_COUNT);
              const hiddenCount = photos.length - visiblePhotos.length;

              return (
                <li key={day.day} className="trip-program-day">
                  <span className="trip-program-day-number">{day.day} diena</span>
                  <h3>{day.title}</h3>
                  <p>{day.description}</p>

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

        {activeTab === "included" && (
          <div className="trip-included-grid">
            <div>
              <h3>
                <IoCheckmarkCircleOutline aria-hidden="true" /> Įskaičiuota
              </h3>
              <ul>
                {(trip.inclusions ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>
                <IoCloseCircleOutline aria-hidden="true" /> Neįskaičiuota
              </h3>
              <ul>
                {(trip.exclusions ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "memo" &&
          (trip.travellerMemo ? (
            <TripMemo text={trip.travellerMemo} />
          ) : (
            <p>Kelionės atmintinė bus paskelbta artimiausiu metu.</p>
          ))}
      </div>
    </>
  );
}
