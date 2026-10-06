import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoCloseCircleOutline } from "react-icons/io5";
import { fetchTrips } from "../../api/trips";
import type { Trip, TripType, TripSearchFilters } from "../../types/trip";
import {
  getTripCardEntries,
  getTripPricing,
  matchesSearchFilters,
  type TripCardEntry,
} from "../../utils/tripHelpers";
import TripCard from "./TripCard";
import Pagination from "./Pagination";
import "./MainCard.css";

type CategoryFilter = "ALL" | TripType | "GUARANTEED";
type SortOption = "default" | "price-asc" | "price-desc" | "date-asc";

const ITEMS_PER_PAGE = 6;

interface MainCardProps {
  searchFilters?: TripSearchFilters | null;
  onClearSearch?: () => void;
}

export default function MainCard({ searchFilters = null, onClearSearch }: MainCardProps) {
  const navigate = useNavigate();

  // Track which cards have their dates expanded
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const sectionRef = useRef<HTMLElement>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchTrips().then((data) => {
      if (cancelled) return;
      setTrips(data);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Trips with multiple departures render as one card per departure
  const allCardEntries = useMemo(() => getTripCardEntries(trips), [trips]);

  // SearchForm's criteria narrow the catalog first; the category tabs below
  // then refine further within that already-searched set.
  const searchFilteredEntries = useMemo(
    () => allCardEntries.filter((entry) => matchesSearchFilters(entry, searchFilters)),
    [allCardEntries, searchFilters]
  );

  // Reset to a clean "ALL" view whenever a new search comes in, so a leftover
  // tab selection from a previous search can't silently zero out the results.
  // Adjusted during render (React's recommended pattern for resetting state
  // in response to a prop change) rather than in an effect, which would cost
  // an extra render pass — see react-hooks/set-state-in-effect.
  const [prevSearchFilters, setPrevSearchFilters] = useState(searchFilters);
  if (searchFilters !== prevSearchFilters) {
    setPrevSearchFilters(searchFilters);
    setSelectedCategory("ALL");
    setCurrentPage(1);
  }

  // Filter cards by category
  const filteredCardEntries = useMemo(() => {
    return searchFilteredEntries.filter(({ trip, departure }) => {
      if (selectedCategory === "ALL") return true;
      if (selectedCategory === "GUARANTEED") return departure.guaranteedOverride;
      return trip.tripType === selectedCategory;
    });
  }, [searchFilteredEntries, selectedCategory]);

  // Sort cards. "default" also sorts by date so cards never appear in a
  // jumbled order — it just doesn't override that with a price sort.
  const sortedCardEntries = useMemo(() => {
    const list = [...filteredCardEntries];
    const byDateAsc = (a: TripCardEntry, b: TripCardEntry) =>
      (a.departure.date || "").localeCompare(b.departure.date || "");

    switch (sortBy) {
      case "price-asc":
        return list.sort(
          (a, b) => getTripPricing(a.departure).finalCost - getTripPricing(b.departure).finalCost
        );
      case "price-desc":
        return list.sort(
          (a, b) => getTripPricing(b.departure).finalCost - getTripPricing(a.departure).finalCost
        );
      case "date-asc":
      case "default":
      default:
        return list.sort(byDateAsc);
    }
  }, [filteredCardEntries, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedCardEntries.length / ITEMS_PER_PAGE);
  const paginatedCardEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCardEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCardEntries, currentPage]);

  // Category counts (reflect the current search, not the whole catalog)
  const categoryCounts = useMemo(() => {
    return {
      ALL: searchFilteredEntries.length,
      BUS: searchFilteredEntries.filter((e) => e.trip.tripType === "BUS").length,
      FLIGHT: searchFilteredEntries.filter((e) => e.trip.tripType === "FLIGHT").length,
      CRUISE: searchFilteredEntries.filter((e) => e.trip.tripType === "CRUISE").length,
      GUARANTEED: searchFilteredEntries.filter((e) => e.departure.guaranteedOverride).length,
    };
  }, [searchFilteredEntries]);

  const handleCategoryChange = (category: CategoryFilter) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchFilters !== null || selectedCategory !== "ALL";

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setCurrentPage(1);
    onClearSearch?.();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTripClick = (trip: Trip) => {
    navigate(`/trips/${trip.slug}`);
  };

  return (
    <section className="main-cards-section" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="main-cards-header">
          <div className="main-cards-title-row">
            <div>
              <h2 className="main-cards-title">Populiariausios kelionės</h2>
              <p className="main-cards-subtitle">
                Atraskite nepamirštamas keliones po Lietuvą ir visą pasaulį
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="main-cards-toolbar">
            <div className="main-cards-tabs" role="tablist" aria-label="Kelionių tipai">
              <button
                type="button"
                className={`category-tab ${selectedCategory === "ALL" ? "active" : ""}`}
                onClick={() => handleCategoryChange("ALL")}
              >
                Visos
                <span className="tab-count">{categoryCounts.ALL}</span>
              </button>

              <button
                type="button"
                className={`category-tab ${selectedCategory === "BUS" ? "active" : ""}`}
                onClick={() => handleCategoryChange("BUS")}
              >
                Autobusu
                <span className="tab-count">{categoryCounts.BUS}</span>
              </button>

              <button
                type="button"
                className={`category-tab ${selectedCategory === "FLIGHT" ? "active" : ""}`}
                onClick={() => handleCategoryChange("FLIGHT")}
              >
                Lėktuvu
                <span className="tab-count">{categoryCounts.FLIGHT}</span>
              </button>

              <button
                type="button"
                className={`category-tab ${selectedCategory === "CRUISE" ? "active" : ""}`}
                onClick={() => handleCategoryChange("CRUISE")}
              >
                Kruizai
                <span className="tab-count">{categoryCounts.CRUISE}</span>
              </button>

              <button
                type="button"
                className={`category-tab ${selectedCategory === "GUARANTEED" ? "active" : ""}`}
                onClick={() => handleCategoryChange("GUARANTEED")}
              >
                Garantuotos
                <span className="tab-count">{categoryCounts.GUARANTEED}</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={handleResetFilters}
                >
                  <IoCloseCircleOutline aria-hidden="true" />
                  Išvalyti filtrus
                </button>
              )}
            </div>

            <div className="main-cards-sort">
              <label htmlFor="trip-sort" className="sort-label">
                Rūšiuoti:
              </label>
              <select
                id="trip-sort"
                className="sort-select"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="default">Rekomenduojami</option>
                <option value="price-asc">Kaina: nuo mažiausios</option>
                <option value="price-desc">Kaina: nuo didžiausios</option>
                <option value="date-asc">Pagal išvykimo datą</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards Grid, Loading, or Empty State */}
        {isLoading ? (
          <div className="cards-loading">Kraunamos kelionės...</div>
        ) : paginatedCardEntries.length > 0 ? (
          <div className="cards-grid">
            {paginatedCardEntries.map(({ trip, departure }) => {
              const cardId = `${trip.id}-${departure.id}`;
              return (
                <TripCard
                  key={cardId}
                  trip={trip}
                  mainDepartureId={departure.id}
                  onClick={handleTripClick}
                  isExpanded={expandedCardIds.has(cardId)}
                  onToggleExpand={() => handleToggleExpand(cardId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="cards-empty">
            <h3>Pagal pasirinktus kriterijus kelionių nerasta</h3>
            <p>Pabandykite pasirinkti kitą kategoriją arba išvalyti filtrus.</p>
            <button
              type="button"
              className="reset-filter-btn"
              onClick={handleResetFilters}
            >
              Rodyti visas keliones
            </button>
          </div>
        )}

        {/* Reusable Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedCardEntries.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </section>
  );
}
