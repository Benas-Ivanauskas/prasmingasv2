import type { TripImage } from "../../types/trip";
import { getScaledImageUrl } from "../../utils/tripHelpers";
import "./TripGallery.css";

const PREVIEW_COUNT = 4;

interface TripGalleryProps {
  /** Gallery images only — caller excludes the hero (already shown above). */
  images: TripImage[];
  fallbackAlt: string;
  /** Index within `images` (not the trip's full image list). */
  onOpen: (index: number) => void;
}

export default function TripGallery({ images, fallbackAlt, onOpen }: TripGalleryProps) {
  if (images.length === 0) return null;

  const visible = images.slice(0, PREVIEW_COUNT);
  const hiddenCount = images.length - visible.length;

  return (
    <div className="trip-gallery">
      {visible.map((img, idx) => {
        const isLastVisible = idx === visible.length - 1;
        const showMoreOverlay = isLastVisible && hiddenCount > 0;

        return (
          <button
            key={`${img.url}-${idx}`}
            type="button"
            className="trip-gallery-thumb"
            onClick={() => onOpen(idx)}
          >
            <img src={getScaledImageUrl(img.url, 400)} alt={img.alt || fallbackAlt} />
            {showMoreOverlay && (
              <span className="trip-gallery-more-overlay">+{hiddenCount} daugiau</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
