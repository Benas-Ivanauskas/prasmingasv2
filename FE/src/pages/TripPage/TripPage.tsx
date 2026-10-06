import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import TripHero from "../../components/TripDetails/TripHero";
import TripSummary from "../../components/TripDetails/TripSummary";
import TripTabs, { type TripDetailTab } from "../../components/TripDetails/TripTabs";
import TripSidebar from "../../components/TripDetails/TripSidebar";
import TripLightbox from "../../components/TripDetails/TripLightbox";
import { useTripBySlug } from "../../hooks/useTripBySlug";
import {
  getTripDepartures,
  getTripPricing,
  getTripAvailability,
  getProgramDayPhotos,
} from "../../utils/tripHelpers";
import "./TripPage.css";

export default function TripPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trip, status } = useTripBySlug(slug);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TripDetailTab>("overview");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <StatusPage message="Kelionė nerasta." />;

  const departures = getTripDepartures(trip);
  const selectedDeparture =
    departures.find((d) => d.id === selectedDepartureId) ?? departures[0];
  const pricing = getTripPricing(selectedDeparture);
  const availability = getTripAvailability(selectedDeparture);
  const heroImage = trip.images[0];

  // One continuous sequence for the lightbox: Overview's own images first
  // (unchanged indices, so onOpenGalleryImage below still works as before),
  // then every Programa day's photos in order — so opening any photo from
  // either tab lets you page through the whole trip, not just that tab.
  const programDayPhotos = (trip.programDays ?? []).map(getProgramDayPhotos);
  const lightboxImages = [...trip.images, ...programDayPhotos.flat()];
  const programDayStartIndex = programDayPhotos.reduce<number[]>((starts, _photos, i) => {
    starts.push(i === 0 ? trip.images.length : starts[i - 1] + programDayPhotos[i - 1].length);
    return starts;
  }, []);

  return (
    <>
      <Header />

      <TripHero
        imageUrl={heroImage?.url}
        imageAlt={heroImage?.alt || trip.title}
        photoCount={trip.images.length}
        onOpenGallery={() => setLightboxIndex(0)}
      />

      {/* Split into two card pieces (visually seamless on desktop via CSS
          Grid placement) specifically so the sidebar can sit between them
          in source order on mobile — "Jūsų kelionė"/price/CTA shows up right
          after the summary instead of after the whole tabbed content below. */}
      <div className="container trip-page-body">
        <div className="trip-page-summary-card">
          <TripSummary
            trip={trip}
            departures={departures}
            selectedDeparture={selectedDeparture}
            onSelectDeparture={setSelectedDepartureId}
            pricing={pricing}
          />
        </div>

        <TripSidebar
          trip={trip}
          selectedDeparture={selectedDeparture}
          pricing={pricing}
          availability={availability}
          onSelectTrip={
            selectedDeparture
              ? () => navigate(`/buy/${trip.slug}/${selectedDeparture.id}`)
              : undefined
          }
        />

        <div className="trip-page-tabs-card">
          <TripTabs
            trip={trip}
            selectedDeparture={selectedDeparture}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenGalleryImage={setLightboxIndex}
            onOpenProgramImage={(dayIndex, photoIndex) =>
              setLightboxIndex(programDayStartIndex[dayIndex] + photoIndex)
            }
          />
        </div>
      </div>

      <Footer />

      {lightboxIndex !== null && (
        <TripLightbox
          images={lightboxImages}
          activeIndex={lightboxIndex}
          title={trip.title}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
