import { useEffect } from "react";
import { IoClose, IoCaretBack, IoCaretForward } from "react-icons/io5";
import type { TripImage } from "../../types/trip";
import { getScaledImageUrl } from "../../utils/tripHelpers";
import "./TripLightbox.css";

interface TripLightboxProps {
  images: TripImage[];
  activeIndex: number;
  title: string;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export default function TripLightbox({
  images,
  activeIndex,
  title,
  onClose,
  onNavigate,
}: TripLightboxProps) {
  const count = images.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((activeIndex - 1 + count) % count);
      if (e.key === "ArrowRight") onNavigate((activeIndex + 1) % count);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, count, onClose, onNavigate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const image = images[activeIndex];
  if (!image) return null;

  return (
    <div
      className="trip-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} nuotraukos`}
    >
      <div className="trip-lightbox-backdrop" onClick={onClose} />

      <button
        type="button"
        className="trip-lightbox-close"
        onClick={onClose}
        aria-label="Uždaryti"
      >
        <IoClose aria-hidden="true" />
      </button>

      {count > 1 && (
        <button
          type="button"
          className="trip-lightbox-nav trip-lightbox-prev"
          onClick={() => onNavigate((activeIndex - 1 + count) % count)}
          aria-label="Ankstesnė nuotrauka"
        >
          <IoCaretBack aria-hidden="true" />
        </button>
      )}

      <img
        className="trip-lightbox-image"
        src={getScaledImageUrl(image.url, 1600)}
        alt={image.alt || title}
      />

      {count > 1 && (
        <button
          type="button"
          className="trip-lightbox-nav trip-lightbox-next"
          onClick={() => onNavigate((activeIndex + 1) % count)}
          aria-label="Kita nuotrauka"
        >
          <IoCaretForward aria-hidden="true" />
        </button>
      )}

      {count > 1 && (
        <div className="trip-lightbox-counter">
          {activeIndex + 1} / {count}
        </div>
      )}
    </div>
  );
}
