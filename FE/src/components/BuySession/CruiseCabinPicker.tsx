import { IoAddCircle, IoRemoveCircle, IoBedOutline } from "react-icons/io5";
import type { CabinType } from "../../types/trip";
import {
  getCabinTypeLabel,
  getCabinCapacity,
  getCabinUnitSize,
  getCabinPricing,
  formatEuro,
} from "../../utils/tripHelpers";
import "./CruiseCabinPicker.css";

interface CruiseCabinPickerProps {
  cabinTypes: CabinType[];
  selections: Record<string, number>;
  onChange: (cabinTypeId: string, quantity: number) => void;
  /** Bus seats picked so far — cabins can never house more people than this. */
  maxTravellers: number;
}

export default function CruiseCabinPicker({
  cabinTypes,
  selections,
  onChange,
  maxTravellers,
}: CruiseCabinPickerProps) {
  const selectedTravellers = cabinTypes.reduce(
    (sum, c) => sum + (selections[c.id] ?? 0) * getCabinUnitSize(c.type),
    0
  );
  const freeTravellers = Math.max(0, maxTravellers - selectedTravellers);

  return (
    <div className="cruise-cabin-picker">
      <h3 className="cruise-cabin-picker-title">Pasirinkite kajutę</h3>

      <p
        className={`cruise-cabin-hint${selectedTravellers > maxTravellers ? " is-error" : ""}`}
      >
        {maxTravellers === 0
          ? "Pirmiausia pasirinkite vietas autobuse – kajutėse negali būti daugiau žmonių nei autobuso vietų."
          : selectedTravellers > maxTravellers
            ? `Kajutėse žmonių (${selectedTravellers}) daugiau nei pasirinktų autobuso vietų (${maxTravellers}). Sumažinkite kajučių arba pasirinkite daugiau vietų autobuse.`
            : `Autobuso vietų: ${maxTravellers} · kajutėse paskirstyta: ${selectedTravellers}`}
      </p>

      {cabinTypes.map((cabin) => {
        // QUAD is sold per PLACE (1 bed = 1 person); DOUBLE/TRIPLE per whole
        // cabin. The stepper counts those units, and each unit covers
        // `unitSize` travellers later in the flow.
        const quantity = selections[cabin.id] ?? 0;
        const available = Math.max(0, cabin.totalUnits - cabin.takenUnits);
        const unitSize = getCabinUnitSize(cabin.type);
        const perPlace = cabin.type === "QUAD";
        const beds = perPlace ? 1 : getCabinCapacity(cabin.type);
        const pricing = getCabinPricing(cabin);
        const soldOut = available <= 0;
        // One more unit must fit both the stock and the remaining bus seats.
        const canAdd = quantity < available && unitSize <= freeTravellers;

        const label = getCabinTypeLabel(cabin.type);

        return (
          <div key={cabin.id} className="cruise-cabin-row">
            <div className="cruise-cabin-info">
              <span className="cruise-cabin-name">
                {label}
                <span className="cruise-cabin-beds" aria-hidden="true">
                  {Array.from({ length: beds }, (_, i) => (
                    <IoBedOutline key={i} />
                  ))}
                </span>
              </span>
              <span className="cruise-cabin-price">
                {pricing.hasDiscount && (
                  <>
                    <span className="cruise-cabin-price-original">
                      {formatEuro(pricing.originalPrice)}
                    </span>
                    <span className="cruise-cabin-discount">-{pricing.discount}%</span>
                  </>
                )}
                <span className="cruise-cabin-price-final">
                  {formatEuro(pricing.finalPrice)}/asm.
                </span>
              </span>
              <span className="cruise-cabin-meta">
                {soldOut
                  ? "išparduota"
                  : perPlace
                    ? `liko ${available} vietų`
                    : `liko ${available} kajučių`}
              </span>
              {quantity > 0 && (
                <span className="cruise-cabin-total">
                  {perPlace
                    ? `${quantity} ${quantity === 1 ? "vieta" : "vietos"}`
                    : `${quantity} kajutė${quantity > 1 ? "s" : ""} · iš viso ${quantity * unitSize} keleiviai`}
                </span>
              )}
            </div>

            <div className="cruise-cabin-stepper">
              <button
                type="button"
                className="cruise-cabin-stepper-btn"
                onClick={() => onChange(cabin.id, Math.max(0, quantity - 1))}
                disabled={quantity <= 0}
                aria-label={`Mažiau: ${label}`}
              >
                <IoRemoveCircle aria-hidden="true" />
              </button>

              <span className="cruise-cabin-stepper-count">{quantity}</span>

              <button
                type="button"
                className="cruise-cabin-stepper-btn"
                onClick={() => canAdd && onChange(cabin.id, quantity + 1)}
                disabled={!canAdd}
                aria-label={`Daugiau: ${label}`}
              >
                <IoAddCircle aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
