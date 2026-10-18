import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusPage from "../../components/StatusPage/StatusPage";
import NotFound from "../NotFound/NotFound";
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
  const { trip, status } = useTripBySlug(slug);
  const [activeTab, setActiveTab] = useState<TripDetailTab>("program");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (status === "loading") return <StatusPage message="Kraunama..." />;
  if (!trip) return <NotFound />;

  const departures = getTripDepartures(trip);
  const selectedDeparture = departures[0];
  const pricing = getTripPricing(selectedDeparture);
  const availability = getTripAvailability(selectedDeparture);
  const heroImage = trip.bannerImage ?? trip.images[0];

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
        photoCount={lightboxImages.length}
        onOpenGallery={() => setLightboxIndex(0)}
      />

      {/* Split into two card pieces (visually seamless on desktop via CSS
          Grid placement) specifically so the sidebar can sit between them
          in source order on mobile — "Jūsų kelionė"/price/CTA shows up right
          after the summary instead of after the whole tabbed content below. */}
      <div className="container trip-page-body">
        <div className="trip-page-summary-card">
          <TripSummary trip={trip} selectedDeparture={selectedDeparture} pricing={pricing} />
        </div>

        <TripSidebar trip={trip} selectedDeparture={selectedDeparture} availability={availability} />

        <div className="trip-page-tabs-card">
          <TripTabs
            trip={trip}
            selectedDeparture={selectedDeparture}
            departures={departures}
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
