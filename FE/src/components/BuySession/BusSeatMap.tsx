import type { Seat } from "../../types/trip";
import { buildBusSeatMap } from "./busSeatLayout";
import "./BusSeatMap.css";

interface BusSeatMapProps {
  seats: Seat[];
  selectedSeatIds: Set<string>;
  onToggleSeat: (seatId: string) => void;
  // Admin "pažymėti gidui" režimas: paspaudus FREE/BLOCKED vietą tiesiog
  // perjungia jos status'ą (onToggleSeat callback'as tą ir daro admin pusėje)
  // vietoj pasirinkimo pirkimui. HELD/TAKEN visada neliečiami — tikras
  // užsakymas, nepriklausomai nuo režimo.
  adminMode?: boolean;
  // Vietos, kurias vartotojas PATS laiko per vis dar aktyvų (dar
  // neatlaisvintą) hold'ą, grąžintą iš Step 3 (žr. BuyOneSession.tsx
  // restoredSelection) — atlaisvinamas tik paspaudus "Toliau" iš naujo, tad
  // kol vartotojas vis dar naršo Step 2, šios vietos serverio pusėje rodo
  // tikrą HELD statusą, NET IF vartotojas jau lokaliai jas atžymėjo
  // (pasirinko kitą vietą vietoj jų). Be šio sąrašo, tokia vieta klaidingai
  // atrodytų "rezervuota" (kito žmogaus), nors iš tiesų tai tik pačio
  // vartotojo dar neatlaisvintas senas pasirinkimas.
  ownHeldSeatIds?: Set<string>;
}

export default function BusSeatMap({
  seats,
  selectedSeatIds,
  onToggleSeat,
  adminMode,
  ownHeldSeatIds,
}: BusSeatMapProps) {
  const rows = buildBusSeatMap(seats);

  const renderSeat = (seat: Seat) => {
    const isHeld = seat.status === "HELD";
    const isTaken = seat.status === "TAKEN";
    const isBlocked = seat.status === "BLOCKED";

    if (adminMode) {
      const isDisabled = isHeld || isTaken;
      let stateLabel = "";
      if (isBlocked) stateLabel = ", rezervuota gidui";
      else if (isHeld) stateLabel = ", rezervuota";
      else if (isTaken) stateLabel = ", užimta";

      return (
        <button
          key={seat.id}
          type="button"
          className={`bus-seat ${isBlocked ? "blocked" : ""} ${isHeld ? "held" : ""} ${isTaken ? "taken" : ""}`}
          disabled={isDisabled}
          onClick={() => onToggleSeat(seat.id)}
          aria-pressed={isBlocked}
          aria-label={`Vieta ${seat.seatNumber}${stateLabel}`}
        >
          {seat.seatNumber}
        </button>
      );
    }

    const isSelected = selectedSeatIds.has(seat.id);
    const isOwnHeld = ownHeldSeatIds?.has(seat.id) ?? false;
    const isHeldDisabled = isHeld && !isSelected && !isOwnHeld;
    const isTakenDisabled = isTaken && !isSelected;
    const isDisabled = isHeldDisabled || isTakenDisabled || isBlocked;

    let stateLabel = "";
    if (isBlocked) stateLabel = ", neprieinama";
    else if (isHeldDisabled) stateLabel = ", rezervuota";
    else if (isTakenDisabled) stateLabel = ", užimta";

    return (
      <button
        key={seat.id}
        type="button"
        className={`bus-seat ${isSelected ? "selected" : ""} ${isHeldDisabled ? "held" : ""} ${
          isTakenDisabled ? "taken" : ""
        } ${isBlocked ? "blocked" : ""}`}
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
        {!adminMode && (
          <span className="bus-seat-legend-item">
            <span className="bus-seat-swatch selected" /> Pasirinkta
          </span>
        )}
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch held" /> Rezervuota
        </span>
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch taken" /> Užimta
        </span>
        <span className="bus-seat-legend-item">
          <span className="bus-seat-swatch blocked" /> {adminMode ? "Gidui/personalui" : "Neprieinama"}
        </span>
      </div>
    </div>
  );
}
