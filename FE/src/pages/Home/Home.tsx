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
  const location = useLocation();

  // "Paieška" in the nav links here as /#search-form (from any page), so
  // landing on Home with that hash should scroll straight to the form.
  useEffect(() => {
    if (location.hash === "#search-form") {
      document.getElementById("search-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <>
      <Header />
      <Banner />
      <SearchForm onSearch={setSearchFilters} />
      <MainCard searchFilters={searchFilters} onClearSearch={() => setSearchFilters(null)} />
      <Footer />
    </>
  );
}
