import { IoAddCircle, IoRemoveCircle } from "react-icons/io5";
import type { CabinType } from "../../types/trip";
import { getCabinTypeLabel, getCabinCapacity, formatEuro } from "../../utils/tripHelpers";
import "./CruiseCabinPicker.css";

interface CruiseCabinPickerProps {
  cabinTypes: CabinType[];
  selections: Record<string, number>;
  onChange: (cabinTypeId: string, quantity: number) => void;
}

export default function CruiseCabinPicker({
  cabinTypes,
  selections,
  onChange,
}: CruiseCabinPickerProps) {
  return (
    <div className="cruise-cabin-picker">
      <h3 className="cruise-cabin-picker-title">Pasirinkite kajutę</h3>

      {cabinTypes.map((cabin) => {
        // The stepper below counts CABINS, not people — each one sleeps
        // `capacity` travellers, all paying pricePerPerson, so 1 cabin here
        // means `capacity` bus seats/passengers later in the flow.
        const quantity = selections[cabin.id] ?? 0;
        const available = cabin.totalUnits - cabin.takenUnits;
        const capacity = getCabinCapacity(cabin.type);

        const label = getCabinTypeLabel(cabin.type);

        return (
          <div key={cabin.id} className="cruise-cabin-row">
            <div className="cruise-cabin-info">
              <span className="cruise-cabin-name">{label}</span>
              <span className="cruise-cabin-meta">
                {formatEuro(cabin.pricePerPerson)} asmeniui · {formatEuro(cabin.pricePerPerson * capacity)} kajutei · laisva: {available} kajučių
              </span>
              {quantity > 0 && (
                <span className="cruise-cabin-total">
                  {quantity} kajutė{quantity > 1 ? "s" : ""} · iš viso {quantity * capacity} keleiviai
                </span>
              )}
            </div>

            <div className="cruise-cabin-stepper">
              <button
                type="button"
                className="cruise-cabin-stepper-btn"
                onClick={() => onChange(cabin.id, Math.max(0, quantity - 1))}
                disabled={quantity <= 0}
                aria-label={`Mažiau ${label}`}
              >
                <IoRemoveCircle aria-hidden="true" />
              </button>

              <span className="cruise-cabin-stepper-count">{quantity}</span>

              <button
                type="button"
                className="cruise-cabin-stepper-btn"
                onClick={() => onChange(cabin.id, Math.min(available, quantity + 1))}
                disabled={quantity >= available}
                aria-label={`Daugiau ${label}`}
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
