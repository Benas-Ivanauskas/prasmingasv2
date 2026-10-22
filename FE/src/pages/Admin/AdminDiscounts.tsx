import { useEffect, useState } from "react";
import {
  adminListDiscountCodes,
  adminSaveDiscountCode,
  adminDeleteDiscountCode,
  createEmptyDiscountCode,
} from "../../api/adminDiscounts";
import type { DiscountCode, DiscountType } from "../../types/discount";
import { NumberInput } from "./AdminFormFields";

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Procentas (%)",
  FIXED: "Suma (€)",
};

// Nuolaidos kodas negali būti Aktyvus be galiojimo datos — priešingu atveju
// jis liktų aktyvus neribotą laiką be jokios kontrolės. Taikoma vienoje
// vietoje (saveDiscount), tad galioja visiems keitimams: toggle, datos
// keitimui/išvalymui, naujo kodo pridėjimui.
function assertActiveHasExpiry(discount: Pick<DiscountCode, "isActive" | "expiresAt">): string | null {
  if (discount.isActive && !discount.expiresAt) {
    return "Nuolaidos kodas negali būti aktyvus be galiojimo datos. Pasirinkite datą arba pažymėkite kaip neaktyvų.";
  }
  return null;
}

// Grynai vizualus žymėjimas — DB isActive NEKEIČIAMA automatiškai (jokio
// cron'o). Realus kodo veikimas checkout metu jau ir taip tikrina galiojimą
// dinamiškai (žr. BE discount.service.ts validateDiscountCode) nepriklausomai
// nuo šio isActive lauko — tai tik padeda adminui iškart matyti sąraše.
function isExpired(discount: Pick<DiscountCode, "expiresAt">): boolean {
  if (!discount.expiresAt) return false;
  const today = new Date().toISOString().slice(0, 10);
  return discount.expiresAt.slice(0, 10) < today;
}

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [newDiscount, setNewDiscount] = useState(createEmptyDiscountCode);
  const [discountError, setDiscountError] = useState("");

  const reloadDiscounts = () => adminListDiscountCodes().then((list) => setDiscounts([...list]));

  useEffect(() => {
    let cancelled = false;
    adminListDiscountCodes().then((list) => {
      if (!cancelled) setDiscounts([...list]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDiscount = async (discount: DiscountCode, isNew = false) => {
    const validationError = assertActiveHasExpiry(discount);
    if (validationError) {
      setDiscountError(validationError);
      return;
    }
    // Optimistic local update FIRST — the date/type/value inputs and the
    // Aktyvus/Neaktyvus toggle all call saveDiscount directly with no local
    // state change of their own (unlike `code`, which edits onChange then
    // saves onBlur). Without this, the controlled <input type="date">'s
    // `value` stays bound to the OLD discounts state for the whole async
    // round-trip, so React re-renders with the stale value right after the
    // native date picker fires onChange — visually "snapping back" as if
    // the pick never happened, even though nothing was actually rejected.
    if (!isNew) {
      setDiscounts((prev) => prev.map((d) => (d.id === discount.id ? discount : d)));
    }
    const error = await adminSaveDiscountCode(discount, isNew);
    if (error) {
      setDiscountError(error);
      reloadDiscounts(); // revert the optimistic update since the save failed
    } else {
      setDiscountError("");
    }
  };

  const toggleDiscountActive = (discount: DiscountCode) =>
    saveDiscount({ ...discount, isActive: !discount.isActive });

  const removeDiscount = async (discount: DiscountCode) => {
    if (!window.confirm(`Ištrinti nuolaidos kodą „${discount.code}“?`)) return;
    await adminDeleteDiscountCode(discount.id);
    reloadDiscounts();
  };

  const addDiscount = async () => {
    const code = newDiscount.code.trim().toUpperCase();
    if (!code) {
      setDiscountError("Įveskite nuolaidos kodą.");
      return;
    }
    const validationError = assertActiveHasExpiry(newDiscount);
    if (validationError) {
      setDiscountError(validationError);
      return;
    }
    const error = await adminSaveDiscountCode({ ...newDiscount, code }, true);
    if (error) {
      setDiscountError(error);
      return;
    }
    setDiscountError("");
    setNewDiscount(createEmptyDiscountCode());
    reloadDiscounts();
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Nuolaidos</h1>
          <p>Tvarkykite nuolaidų kodus, naudojamus apmokėjimo žingsnyje.</p>
        </div>
      </div>

      <section className="admin-card">
        <h3>Nuolaidos kodai</h3>

        {discounts.map((discount) => (
          <div className="admin-row" key={discount.id}>
            <input
              value={discount.code}
              placeholder="Kodas"
              onChange={(e) =>
                setDiscounts((prev) =>
                  prev.map((d) => (d.id === discount.id ? { ...d, code: e.target.value } : d))
                )
              }
              onBlur={() => saveDiscount({ ...discount, code: discount.code.trim().toUpperCase() })}
            />
            <select
              value={discount.type}
              onChange={(e) => saveDiscount({ ...discount, type: e.target.value as DiscountType })}
            >
              <option value="PERCENTAGE">{TYPE_LABELS.PERCENTAGE}</option>
              <option value="FIXED">{TYPE_LABELS.FIXED}</option>
            </select>
            <NumberInput
              min={0}
              step={discount.type === "PERCENTAGE" ? 1 : 0.01}
              value={discount.value}
              onChange={(v) => saveDiscount({ ...discount, value: v ?? 0 })}
            />
            <input
              type="date"
              title="Galioja iki (privaloma, jei kodas Aktyvus)"
              value={discount.expiresAt ?? ""}
              onChange={(e) => saveDiscount({ ...discount, expiresAt: e.target.value || null })}
            />
            <button
              type="button"
              className={`admin-pill ${discount.isActive ? "is-on" : "is-off"}`}
              onClick={() => toggleDiscountActive(discount)}
            >
              {discount.isActive ? "Aktyvus" : "Neaktyvus"}
            </button>
            {discount.isActive && isExpired(discount) && (
              <span className="admin-pill is-off" title="Galiojimo data praėjusi — kodas nebeveikia pirkimo metu">
                Pasibaigęs
              </span>
            )}
            <button
              type="button"
              className="admin-link is-danger"
              onClick={() => removeDiscount(discount)}
            >
              Ištrinti
            </button>
          </div>
        ))}

        <div className="admin-row">
          <input
            value={newDiscount.code}
            placeholder="Naujas kodas (pvz. VASARA15)"
            onChange={(e) => setNewDiscount((prev) => ({ ...prev, code: e.target.value }))}
          />
          <select
            value={newDiscount.type}
            onChange={(e) =>
              setNewDiscount((prev) => ({ ...prev, type: e.target.value as DiscountType }))
            }
          >
            <option value="PERCENTAGE">{TYPE_LABELS.PERCENTAGE}</option>
            <option value="FIXED">{TYPE_LABELS.FIXED}</option>
          </select>
          <NumberInput
            min={0}
            step={newDiscount.type === "PERCENTAGE" ? 1 : 0.01}
            value={newDiscount.value}
            onChange={(v) => setNewDiscount((prev) => ({ ...prev, value: v ?? 0 }))}
          />
          <input
            type="date"
            title="Galioja iki (privaloma, jei kodas Aktyvus)"
            value={newDiscount.expiresAt ?? ""}
            onChange={(e) =>
              setNewDiscount((prev) => ({ ...prev, expiresAt: e.target.value || null }))
            }
          />
        </div>
        {discountError && <p className="admin-field-hint">{discountError}</p>}
        <button type="button" className="admin-add" onClick={addDiscount}>
          + Pridėti nuolaidos kodą
        </button>
      </section>
    </>
  );
}
