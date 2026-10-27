import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Banner from "../../components/Banner/Banner";
import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import MainCard from "../../components/MainCards/MainCard";
import SearchForm from "../../components/SearchForm/SearchForm";
import type { TripSearchFilters } from "../../types/trip";

export default function Home() {
  const [searchFilters, setSearchFilters] = useState<TripSearchFilters | null>(null);
  // Bumping this forces SearchForm to remount, resetting its own internal
  // state (tripType/category/destination/dates/price) back to defaults —
  // SearchForm only reports filters up on submit, it doesn't listen for
  // external resets, so a fresh instance is the simplest way to clear it.
  const [searchFormKey, setSearchFormKey] = useState(0);
  const location = useLocation();

  // "Paieška" in the nav links here as /#paieska (from any page), so
  // landing on Home with that hash should scroll straight to the form.
  useEffect(() => {
    if (location.hash === "#paieska") {
      document.getElementById("paieska")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <>
      <Header />
      <Banner />
      <SearchForm key={searchFormKey} onSearch={setSearchFilters} />
      <MainCard
        searchFilters={searchFilters}
        onClearSearch={() => {
          setSearchFilters(null);
          setSearchFormKey((k) => k + 1);
        }}
      />
      <Footer />
    </>
  );
}
