import type { ReactNode } from "react";
import type { TravellerForm } from "../../types/order";
import { stripSpaces } from "../../utils/validation";
// .traveller-card/.traveller-fields/.traveller-seat-badge styles live here —
// shared with BuyTravellerInfo.tsx's own "Kontaktinė informacija" card,
// which uses the same classes, so they stay defined in one place.
import "../../pages/BuySession/BuyTravellerInfo.css";

interface TravellerFieldsProps {
  index: number; // 0-based — rendered as "{index + 1}. Keleivis"
  traveller: TravellerForm;
  isFlight: boolean;
  onChange: (field: keyof TravellerForm, value: string) => void;
  seatLabel?: string;
  // Rendered right after the heading (e.g. BuyTravellerInfo's per-seat price
  // row) / right after the fields grid (e.g. its per-traveller extras list)
  // — optional, so a plainer caller (AdminOrderNew) can render just the card.
  headerExtra?: ReactNode;
  children?: ReactNode;
}

// Shared "one traveller's personal info" card — used by both the public
// booking flow (BuyTravellerInfo.tsx, Step 3 "Keleiviai") and the admin
// manual order form (AdminOrderNew.tsx), so a multi-traveller order collects
// the same real per-person data (not just one contact name) in both places.
export default function TravellerFields({
  index,
  traveller,
  isFlight,
  onChange,
  seatLabel,
  headerExtra,
  children,
}: TravellerFieldsProps) {
  return (
    <div className="traveller-card">
      <h3>
        {index + 1}. Keleivis
        {seatLabel && <span className="traveller-seat-badge">Vieta Nr. {seatLabel}</span>}
      </h3>

      {headerExtra}

      <div className="traveller-fields">
        <label>
          Vardas *
          <input
            type="text"
            value={traveller.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
          />
        </label>
        <label>
          Pavardė *
          <input
            type="text"
            value={traveller.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
          />
        </label>
        <label>
          Gimimo data *
          <input
            type="date"
            value={traveller.birthDate}
            onChange={(e) => onChange("birthDate", e.target.value)}
          />
        </label>
        <label>
          Asmens kodas
          <input
            type="text"
            value={traveller.personalCode}
            onChange={(e) => onChange("personalCode", stripSpaces(e.target.value))}
          />
        </label>

        {isFlight && (
          <>
            <label>
              Paso numeris *
              <input
                type="text"
                value={traveller.passportNumber}
                onChange={(e) => onChange("passportNumber", stripSpaces(e.target.value))}
              />
            </label>
            <label>
              Paso galiojimo data *
              <input
                type="date"
                value={traveller.passportExpiry}
                onChange={(e) => onChange("passportExpiry", e.target.value)}
              />
            </label>
          </>
        )}
      </div>

      {children}
    </div>
  );
}
