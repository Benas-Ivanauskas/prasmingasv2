import { getScaledImageUrl } from "../../utils/tripHelpers";
import "./TripHero.css";

interface TripHeroProps {
  imageUrl?: string;
  imageAlt: string;
  photoCount: number;
  onOpenGallery: () => void;
}

export default function TripHero({
  imageUrl,
  imageAlt,
  photoCount,
  onOpenGallery,
}: TripHeroProps) {
  return (
    <div className="container">
      <div className="trip-hero-card">
        <img
          src={imageUrl ? getScaledImageUrl(imageUrl, 1600) : undefined}
          alt={imageAlt}
        />
        {photoCount > 1 && (
          <button
            type="button"
            className="trip-hero-gallery-btn"
            onClick={onOpenGallery}
          >
            {photoCount} nuotraukos
          </button>
        )}
      </div>
    </div>
  );
}
