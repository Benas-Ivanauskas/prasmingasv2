import { useState } from "react";
import {
  IoAirplaneOutline,
  IoBusOutline,
  IoBoatOutline,
  IoSearch,
  IoCalendarOutline,
} from "react-icons/io5";
import type { TripType, TripCategory, TripSearchFilters } from "../../types/trip";
import { formatEuro } from "../../utils/tripHelpers";
import "./SearchForm.css";

// Helpers for formatted date strings (YYYY-MM-DD)
const getTodayFormatted = () => new Date().toISOString().split("T")[0];
const getFutureDateFormatted = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
};

interface SearchFormProps {
  onSearch?: (filters: TripSearchFilters) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [tripType, setTripType] = useState<TripType>("FLIGHT");
  const [category, setCategory] = useState<TripCategory>("SIGHTSEEING");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(getTodayFormatted());
  const [endDate, setEndDate] = useState(getFutureDateFormatted(7));
  const [price, setPrice] = useState(2500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters: TripSearchFilters = {
      tripType,
      category,
      destination,
      startDate,
      endDate,
      maxPrice: price,
    };

    onSearch?.(filters);
  };

  return (
    <section className="search-form-section" id="search-form">
      <div className="container">
        <form className="search-card" onSubmit={handleSubmit}>
          {/* Top Search Controls */}
          <div className="search-main-row">
            {/* Destination Field */}
            <div className="search-input-group destination-group">
              <span className="input-icon">
                <IoSearch />
              </span>

              <input
                type="text"
                className="search-input"
                placeholder="Kur norėtumėte keliauti?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            {/* Select travel type */}
            <select
              onChange={(e) => setCategory(e.target.value as TripCategory)}
              value={category}
              className="search-input-group travel-type-select"
            >
              <option value="SIGHTSEEING">Pažintinės</option>
              <option value="LEISURE">Poilsinės</option>
            </select>

            {/* Submit Button */}
            <button type="submit" className="search-submit-btn">
              <IoSearch className="btn-icon" />
              <span>Ieškoti</span>
            </button>
          </div>

          {/* Secondary Filters: Trip Type, Duration (Start & End Date), Price */}
          <div className="search-filters-row">
            {/* 1. Trip Mode (Plane, Bus, Cruise) */}
            <div className="filter-col trip-col">
              <div className="filter-header">
                <span className="filter-label">Kelionių tipas</span>
              </div>
              <div className="filter-control trip-type-options">
                <button
                  type="button"
                  className={`trip-type-btn ${tripType === "FLIGHT" ? "active" : ""}`}
                  onClick={() => setTripType("FLIGHT")}
                >
                  <IoAirplaneOutline className="trip-icon" />
                  <span className="trip-btn-label">Lėktuvu</span>
                </button>

                <button
                  type="button"
                  className={`trip-type-btn ${tripType === "BUS" ? "active" : ""}`}
                  onClick={() => setTripType("BUS")}
                >
                  <IoBusOutline className="trip-icon" />
                  <span className="trip-btn-label">Autobusu</span>
                </button>

                <button
                  type="button"
                  className={`trip-type-btn ${tripType === "CRUISE" ? "active" : ""}`}
                  onClick={() => setTripType("CRUISE")}
                >
                  <IoBoatOutline className="trip-icon" />
                  <span className="trip-btn-label">Kruizas</span>
                </button>
              </div>
            </div>

            {/* 2. Duration: Two separate inputs (Start Date & End Date) with top days counter */}
            <div className="filter-col duration-col">
              <div className="filter-header">
                <span className="filter-label">Kelionės datos</span>
              </div>

              <div className="filter-control duration-inputs-grid">
                {/* Input 1: Start Date */}
                <div className="date-input-wrapper">
                  <span className="date-field-icon">
                    <IoCalendarOutline />
                  </span>
                  <input
                    type="date"
                    className="date-field"
                    title="Nuo (išvykimo data)"
                    min={getTodayFormatted()}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                  />
                </div>

                {/* Input 2: End Date */}
                <div className="date-input-wrapper">
                  <span className="date-field-icon">
                    <IoCalendarOutline />
                  </span>
                  <input
                    type="date"
                    className="date-field"
                    title="Iki (grįžimo data)"
                    min={startDate || getTodayFormatted()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 3. Price Slider */}
            <div className="filter-col price-col">
              <div className="filter-header">
                <span className="filter-label">Kaina</span>
                <span className="price-display">
                  nuo 0 € iki {formatEuro(price)}
                </span>
              </div>
              <div className="filter-control slider-container">
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="price-slider"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
