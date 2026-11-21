import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoCloseCircleOutline } from "react-icons/io5";
import { fetchTrips } from "../../api/trips";
import type { Trip, TripSearchFilters } from "../../types/trip";
import {
  getTripCardEntries,
  getTripPricing,
  matchesSearchFilters,
  pluralizeLt,
  type TripCardEntry,
} from "../../utils/tripHelpers";
import TripCard from "./TripCard";
import Pagination from "./Pagination";
import "./MainCard.css";

// Kategorijų pilys gyvena Header.tsx (veikia iš bet kurio puslapio, kaip
// "/?category=BUS"), ne čia — šis komponentas tik SKAITO ?category iš URL,
// kad abu komponentai dalintųsi ta pačia filtro būsena be prop-drilling.
export type CategoryFilter = "ALL" | "BUS" | "FLIGHT" | "CRUISE" | "GUARANTEED" | "CHRISTMAS";
type SortOption = "default" | "price-asc" | "price-desc" | "date-asc";

const ITEMS_PER_PAGE = 20;

interface MainCardProps {
  searchFilters?: TripSearchFilters | null;
  onClearSearch?: () => void;
}

export default function MainCard({ searchFilters = null, onClearSearch }: MainCardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const selectedCategory = (searchParams.get("category") as CategoryFilter) || "ALL";
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
  // category selection from a previous search can't silently zero out the
  // results. The category now lives in the URL (set from Header.tsx, which
  // is reachable from every page) rather than local state, so this reset
  // is a navigation side effect — an effect, not the in-render derived-state
  // trick the old purely-local version used. Skips its very first run (on
  // mount) — otherwise landing directly on "/?category=BUS" from Header
  // would immediately strip the category it was supposed to apply.
  const isFirstSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    if (searchParams.has("category")) {
      setSearchParams(
        (prev) => {
          prev.delete("category");
          return prev;
        },
        { replace: true }
      );
    }
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters]);

  // Clicking a category pill in Header.tsx navigates here with a new
  // ?category= value — reset back to page 1 so a stale page number from a
  // previous (possibly shorter) category list can't land out of range.
  // Render-time derived-state comparison (not an effect) — React's own
  // recommended pattern for resetting state in response to a prop/URL
  // change, avoids an extra render pass (the searchFilters reset above
  // has to be an effect instead, since it also needs to call
  // setSearchParams — a navigation side effect, not just local state).
  const [prevCategory, setPrevCategory] = useState(selectedCategory);
  if (selectedCategory !== prevCategory) {
    setPrevCategory(selectedCategory);
    setCurrentPage(1);
  }

  // Filter cards by category
  const filteredCardEntries = useMemo(() => {
    return searchFilteredEntries.filter(({ trip, departure }) => {
      switch (selectedCategory) {
        case "ALL":
          return true;
        case "GUARANTEED":
          return departure.guaranteedOverride;
        case "CHRISTMAS":
          return trip.filterTags?.includes("kaledines") ?? false;
        default:
          return trip.tripType === selectedCategory;
      }
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

  const hasActiveFilters = searchFilters !== null;

  const handleResetFilters = () => {
    if (searchParams.has("category")) {
      setSearchParams((prev) => {
        prev.delete("category");
        return prev;
      });
    }
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
    navigate(`/kelione/${trip.slug}`);
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

          {/* Filter Toolbar — kategorijų pilys dabar Header.tsx (veikia iš bet
              kurio puslapio per "/?category=X"), čia lieka tik rastų kelionių
              kiekis (kairėje) ir rūšiavimas (dešinėje). */}
          <div className="main-cards-toolbar">
            <div className="main-cards-count-group">
              <span className="main-cards-count">
                Rasta {sortedCardEntries.length}{" "}
                {pluralizeLt(sortedCardEntries.length, "kelionė", "kelionės", "kelionių")}
              </span>
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
