import { useState } from "react";
import type { CabinTypeName, Departure, DepartureStatus, TripType } from "../../types/trip";
import { BUS_SIZES, resizeSeats } from "../../api/adminTrips";
import { getCabinTypeLabel, getDepartureCapacity } from "../../utils/tripHelpers";
import BusSeatMap from "../../components/BuySession/BusSeatMap";
import { Field, NumberInput } from "./AdminFormFields";
import { patchAt, removeAt, moveAt } from "./adminFormHelpers";

interface Props {
  index: number;
  departure: Departure;
  tripType: TripType;
  canRemove: boolean;
  onChange: (patch: Partial<Departure>) => void;
  onRemove: () => void;
}

const CABIN_TYPES: CabinTypeName[] = ["QUAD", "DOUBLE", "TRIPLE"];
const STATUSES: { value: DepartureStatus; label: string }[] = [
  { value: "ACTIVE", label: "Aktyvus" },
  { value: "DONE", label: "Įvykęs" },
  { value: "ARCHIVED", label: "Archyvuotas" },
];

export default function AdminDepartureEditor({
  index,
  departure: d,
  tripType,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const hasBus = tripType === "BUS" || tripType === "CRUISE";
  const pickupPoints = d.pickupPoints ?? [];
  const cabinTypes = d.cabinTypes ?? [];
  const extraOptions = d.extraOptions ?? [];
  const busSize = d.seats?.length ?? 0;
  const { totalSeats: capacity } = getDepartureCapacity(d);
  const [draggedPickupIndex, setDraggedPickupIndex] = useState<number | null>(null);
  const [pickupDragOverIndex, setPickupDragOverIndex] = useState<number | null>(null);

  // Leidžia adminui pažymėti/atžymėti FREE↔BLOCKED vietas (gidui/personalui) —
  // HELD/TAKEN niekada nepaliečiamos čia (tikras užsakymas, apsaugota BE pusėje).
  const toggleSeatBlocked = (seatId: string) => {
    const seats = d.seats ?? [];
    const next = seats.map((s) => {
      if (s.id !== seatId) return s;
      if (s.status === "HELD" || s.status === "TAKEN") return s;
      return { ...s, status: s.status === "BLOCKED" ? ("FREE" as const) : ("BLOCKED" as const) };
    });
    onChange({ seats: next });
  };

  return (
    <div className="admin-sub-card">
      <div className="admin-sub-head">
        <h4>Išvykimas #{index + 1}</h4>
        {canRemove && (
          <button type="button" className="admin-link is-danger" onClick={onRemove}>
            Pašalinti išvykimą
          </button>
        )}
      </div>

      <div className="admin-grid">
        <Field label="Data *">
          <input
            type="date"
            value={d.date.slice(0, 10)}
            onChange={(e) => onChange({ date: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })}
          />
        </Field>
        <Field label="Trukmė (dienos) *">
          <NumberInput min={1} value={d.durationDays} onChange={(v) => onChange({ durationDays: v ?? 1 })} />
        </Field>
        <Field label="Kaina asmeniui (€) *">
          <NumberInput min={0} step={0.01} value={d.cost} onChange={(v) => onChange({ cost: v ?? 0 })} />
        </Field>
        <Field label="Nuolaida (%)">
          <NumberInput min={0} value={d.discount} onChange={(v) => onChange({ discount: v })} />
        </Field>
        <Field label="Būsena">
          <select value={d.status} onChange={(e) => onChange({ status: e.target.value as DepartureStatus })}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Garantuota nuo (žmonių skaičiaus)"
          hint={capacity !== null ? `Iš viso vietų: ${capacity}. Palikus tuščią — 70% nuo šio skaičiaus.` : undefined}
        >
          <NumberInput
            min={0}
            value={d.guaranteeThreshold}
            onChange={(v) => onChange({ guaranteeThreshold: v })}
          />
        </Field>
        <Field label="Likusio mokėjimo priminimas (d. prieš)">
          <NumberInput
            min={0}
            value={d.remainingPaymentDays}
            onChange={(v) => onChange({ remainingPaymentDays: v ?? 0 })}
          />
        </Field>
        <Field label="Depozito dydis (%, 0 = tik pilnas apmokėjimas)">
          <NumberInput
            min={0}
            max={100}
            value={d.depositPercentage}
            onChange={(v) => onChange({ depositPercentage: v })}
          />
        </Field>
        <Field
          label="Depozito terminas (paskutinė diena)"
          hint="Po šios dienos siūlomas tik pilnas apmokėjimas. Tuščia = be termino."
        >
          <input
            type="date"
            value={d.depositDeadline?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange({
                depositDeadline: e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
              })
            }
          />
        </Field>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={d.guaranteedOverride}
            onChange={(e) => onChange({ guaranteedOverride: e.target.checked })}
          />
          Visada žymėti kaip garantuotą
        </label>
      </div>

      {hasBus && (
        <>
          <h5>Autobuso dydis</h5>
          <div className="admin-grid">
            <Field label="Vietų skaičius" hint={tripType === "CRUISE" ? "Autobusas į uostą" : undefined}>
              <select
                value={busSize || ""}
                onChange={(e) =>
                  onChange({ seats: resizeSeats(d.id, d.seats, Number(e.target.value)) })
                }
              >
                <option value="" disabled>
                  Pasirinkite…
                </option>
                {BUS_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} vietų
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {(d.seats?.length ?? 0) > 0 && (
            <>
              <h5>Gidui/personalui rezervuotos vietos</h5>
              <p className="admin-field-hint">
                Paspauskite vietą, kad pažymėtumėte ją gidui/personalui (niekad nesiūloma viešai) arba atžymėtumėte atgal.
              </p>
              <BusSeatMap
                seats={d.seats ?? []}
                selectedSeatIds={new Set()}
                onToggleSeat={toggleSeatBlocked}
                adminMode
              />
            </>
          )}
        </>
      )}

      <h5>Išvykimo vietos</h5>
      {tripType === "FLIGHT" && (
        <p className="admin-field-hint">
          Pvz. iš kurio oro uosto išskrendama — skrydžiams paprastai užtenka vienos vietos.
        </p>
      )}
      {pickupPoints.map((p, i) => (
        <div
          key={i}
          className={`admin-row admin-row-draggable${draggedPickupIndex === i ? " is-dragging" : ""}${pickupDragOverIndex === i && draggedPickupIndex !== i ? " is-drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedPickupIndex !== null && draggedPickupIndex !== i) setPickupDragOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedPickupIndex !== null) {
              onChange({ pickupPoints: moveAt(pickupPoints, draggedPickupIndex, i) });
            }
            setDraggedPickupIndex(null);
            setPickupDragOverIndex(null);
          }}
        >
          <span
            className="admin-row-drag-handle"
            title="Tempti ir perrikiuoti"
            draggable
            onDragStart={() => setDraggedPickupIndex(i)}
            onDragEnd={() => {
              setDraggedPickupIndex(null);
              setPickupDragOverIndex(null);
            }}
          >
            ⠿
          </span>
          <input
            placeholder={tripType === "FLIGHT" ? "Oro uostas" : "Miestas"}
            value={p.city}
            onChange={(e) => onChange({ pickupPoints: patchAt(pickupPoints, i, { city: e.target.value }) })}
          />
          <button
            type="button"
            className="admin-link is-danger"
            onClick={() => onChange({ pickupPoints: removeAt(pickupPoints, i) })}
          >
            Pašalinti
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-add"
        onClick={() => onChange({ pickupPoints: [...pickupPoints, { city: "" }] })}
      >
        + Pridėti išvykimo vietą
      </button>

      {tripType === "FLIGHT" && (
        <>
          <h5>Skrydžio bilietai</h5>
          <div className="admin-grid">
            <Field label="Bendras bilietų skaičius">
              <NumberInput
                min={0}
                value={d.flightSeatsTotal}
                onChange={(v) => onChange({ flightSeatsTotal: v })}
              />
            </Field>
          </div>
          <p className="admin-field-hint">
            Parduota/laikoma: <strong>{d.flightSeatsTaken ?? 0}</strong>
            {typeof d.flightSeatsTotal === "number" ? ` iš ${d.flightSeatsTotal}` : ""} — atnaujinama tik
            pirkimo metu, čia tik peržiūrai.
          </p>
        </>
      )}

      {tripType === "CRUISE" && (
        <>
          <h5>Kajutės</h5>
          <p className="admin-field-hint">
            Keturvietė parduodama po vietą (kiekis – vietos), dvivietė ir trivietė – visa kajute (kiekis –
            kajutės). Kaina nurodoma pilna, nuolaida – procentais.
          </p>
          {cabinTypes.map((c, i) => (
            <div key={c.id} className="admin-row">
              <select
                value={c.type}
                onChange={(e) =>
                  onChange({ cabinTypes: patchAt(cabinTypes, i, { type: e.target.value as CabinTypeName }) })
                }
              >
                {CABIN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {getCabinTypeLabel(t)}
                  </option>
                ))}
              </select>
              <NumberInput
                min={0}
                step={0.01}
                value={c.pricePerPerson}
                onChange={(v) => onChange({ cabinTypes: patchAt(cabinTypes, i, { pricePerPerson: v ?? 0 }) })}
              />
              <NumberInput
                min={0}
                value={c.discount}
                onChange={(v) => onChange({ cabinTypes: patchAt(cabinTypes, i, { discount: v }) })}
              />
              <NumberInput
                min={0}
                value={c.totalUnits}
                onChange={(v) => onChange({ cabinTypes: patchAt(cabinTypes, i, { totalUnits: v ?? 0 }) })}
              />
              <span className="admin-muted" title="Parduota — atnaujinama tik pirkimo metu, čia tik peržiūrai">
                Parduota: <strong>{c.takenUnits}</strong>
              </span>
              <button
                type="button"
                className="admin-link is-danger"
                onClick={() => onChange({ cabinTypes: removeAt(cabinTypes, i) })}
              >
                Pašalinti
              </button>
            </div>
          ))}
          {cabinTypes.length > 0 && (
            <p className="admin-field-hint">
              Stulpeliai: tipas · kaina € · nuolaida % · viso vietų/kajučių · parduota (peržiūrai)
            </p>
          )}
          <button
            type="button"
            className="admin-add"
            onClick={() =>
              onChange({
                cabinTypes: [
                  ...cabinTypes,
                  {
                    id: `cabin-${d.id}-${cabinTypes.length + 1}-${Date.now()}`,
                    type: "DOUBLE",
                    pricePerPerson: 0,
                    discount: null,
                    totalUnits: 0,
                    takenUnits: 0,
                  },
                ],
              })
            }
          >
            + Pridėti kajutės tipą
          </button>
        </>
      )}

      <h5>Papildomos paslaugos</h5>
      {extraOptions.map((x, i) => (
        <div key={x.id} className="admin-row">
          <input
            placeholder="Pavadinimas (pvz. Bagažas)"
            value={x.name}
            onChange={(e) => onChange({ extraOptions: patchAt(extraOptions, i, { name: e.target.value }) })}
          />
          <NumberInput
            min={0}
            step={0.01}
            value={x.price}
            onChange={(v) => onChange({ extraOptions: patchAt(extraOptions, i, { price: v ?? 0 }) })}
          />
          <button
            type="button"
            className="admin-link is-danger"
            onClick={() => onChange({ extraOptions: removeAt(extraOptions, i) })}
          >
            Pašalinti
          </button>
        </div>
      ))}
      {extraOptions.length < 5 && (
        <button
          type="button"
          className="admin-add"
          onClick={() =>
            onChange({
              extraOptions: [
                ...extraOptions,
                { id: `extra-${Date.now()}-${extraOptions.length}`, name: "", price: 0, sortOrder: extraOptions.length },
              ],
            })
          }
        >
          + Pridėti paslaugą
        </button>
      )}
    </div>
  );
}
