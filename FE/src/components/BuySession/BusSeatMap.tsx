import type { Seat } from "../../types/trip";
import { buildBusSeatMap } from "./busSeatLayout";
import "./BusSeatMap.css";

interface BusSeatMapProps {
  seats: Seat[];
  selectedSeatIds: Set<string>;
  onToggleSeat: (seatId: string) => void;
}

export default function BusSeatMap({ seats, selectedSeatIds, onToggleSeat }: BusSeatMapProps) {
  const rows = buildBusSeatMap(seats);

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeatIds.has(seat.id);
    const isHeld = seat.status === "HELD" && !isSelected;
    const isTaken = seat.status === "TAKEN" && !isSelected;
    const isDisabled = isHeld || isTaken;

    let stateLabel = "";
    if (isHeld) stateLabel = ", rezervuota";
    else if (isTaken) stateLabel = ", užimta";

    return (
      <button
        key={seat.id}
        type="button"
        className={`bus-seat ${isSelected ? "selected" : ""} ${isHeld ? "held" : ""} ${
          isTaken ? "taken" : ""
        }`}
        disabled={isDisabled}
        onClick={() => onToggleSeat(seat.id)}
        aria-pressed={isSelected}
        aria-label={`Vieta ${seat.seatNumber}${stateLabel}`}
      >
        {seat.seatNumber}
      </button>
    );
  };

  return (
    <div className="bus-seat-map">
      <div className="bus-illustration">
        <div className="bus-windshield-label">PRIEKINIS STIKLAS</div>

        <div className="bus-illustration-top">
          <span className="bus-badge bus-badge-driver">VAIRUOTOJAS</span>
          <span className="bus-badge bus-badge-door">PRIEKINĖS DURYS</span>
        </div>

        <div className="bus-seat-map-body">
          {rows.map((row) => (
            <div key={row.rowNumber} className="bus-seat-row">
              <span className="bus-row-number">{row.rowNumber}</span>

              {row.leftLabel ? (
                <span className="bus-amenity">{row.leftLabel}</span>
              ) : (
                <div className="bus-seat-group">{row.left.map(renderSeat)}</div>
              )}

              {/* Always rendered, even when empty, so every row has the same
                  5 grid children in the same order — an empty middle slot
                  still reserves its column's width, keeping the left/right
                  seat columns aligned across rows regardless of whether
                  this particular row has a bonus middle seat. */}
              <div className="bus-seat-group bus-seat-group-middle">
                {row.middle.map(renderSeat)}
              </div>

              {row.rightLabel ? (
                <span className="bus-amenity">{row.rightLabel}</span>
              ) : (
                <div className="bus-seat-group">{row.right.map(renderSeat)}</div>
              )}

              <span className="bus-row-number">{row.rowNumber}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bus-seat-legend">
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch" /> Laisva
        </span>
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch selected" /> Pasirinkta
        </span>
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch held" /> Rezervuota
        </span>
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch taken" /> Užimta
        </span>
      </div>
    </div>
  );
}
