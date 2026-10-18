import { useEffect, useState } from "react";
import {
  adminListDiscountCodes,
  adminSaveDiscountCode,
  adminDeleteDiscountCode,
  createEmptyDiscountCode,
  adminListVouchers,
  adminSaveVoucher,
  adminDeleteVoucher,
  createEmptyVoucher,
} from "../../api/adminDiscounts";
import type { DiscountCode, DiscountType, GiftVoucher } from "../../types/discount";
import { NumberInput } from "./AdminFormFields";

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Procentas (%)",
  FIXED: "Suma (€)",
};

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [newDiscount, setNewDiscount] = useState(createEmptyDiscountCode);
  const [newVoucher, setNewVoucher] = useState(createEmptyVoucher);
  const [discountError, setDiscountError] = useState("");
  const [voucherError, setVoucherError] = useState("");

  const reloadDiscounts = () => adminListDiscountCodes().then((list) => setDiscounts([...list]));
  const reloadVouchers = () => adminListVouchers().then((list) => setVouchers([...list]));

  useEffect(() => {
    let cancelled = false;
    adminListDiscountCodes().then((list) => {
      if (!cancelled) setDiscounts([...list]);
    });
    adminListVouchers().then((list) => {
      if (!cancelled) setVouchers([...list]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDiscount = async (discount: DiscountCode) => {
    const error = await adminSaveDiscountCode(discount);
    if (error) {
      setDiscountError(error);
      reloadDiscounts();
    } else {
      setDiscountError("");
      reloadDiscounts();
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
    const error = await adminSaveDiscountCode({ ...newDiscount, code });
    if (error) {
      setDiscountError(error);
      return;
    }
    setDiscountError("");
    setNewDiscount(createEmptyDiscountCode());
    reloadDiscounts();
  };

  const saveVoucher = async (voucher: GiftVoucher) => {
    const error = await adminSaveVoucher(voucher);
    if (error) {
      setVoucherError(error);
      reloadVouchers();
    } else {
      setVoucherError("");
      reloadVouchers();
    }
  };

  const toggleVoucherActive = (voucher: GiftVoucher) =>
    saveVoucher({ ...voucher, isActive: !voucher.isActive });

  const removeVoucher = async (voucher: GiftVoucher) => {
    if (!window.confirm(`Ištrinti kuponą „${voucher.code}“?`)) return;
    await adminDeleteVoucher(voucher.id);
    reloadVouchers();
  };

  const addVoucher = async () => {
    const code = newVoucher.code.trim().toUpperCase();
    if (!code) {
      setVoucherError("Įveskite kupono kodą.");
      return;
    }
    const error = await adminSaveVoucher({ ...newVoucher, code });
    if (error) {
      setVoucherError(error);
      return;
    }
    setVoucherError("");
    setNewVoucher(createEmptyVoucher());
    reloadVouchers();
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Nuolaidos ir kuponai</h1>
          <p>Tvarkykite nuolaidų kodus ir dovanų kuponus, naudojamus apmokėjimo žingsnyje.</p>
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
              title="Galioja iki (tuščia = niekada nebaigia galioti)"
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
            title="Galioja iki (tuščia = niekada nebaigia galioti)"
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

      <section className="admin-card">
        <h3>Dovanų kuponai</h3>

        {vouchers.map((voucher) => (
          <div className="admin-row" key={voucher.id}>
            <input
              value={voucher.code}
              placeholder="Kodas"
              onChange={(e) =>
                setVouchers((prev) =>
                  prev.map((v) => (v.id === voucher.id ? { ...v, code: e.target.value } : v))
                )
              }
              onBlur={() => saveVoucher({ ...voucher, code: voucher.code.trim().toUpperCase() })}
            />
            <NumberInput
              min={0}
              step={0.01}
              value={voucher.value}
              onChange={(v) => saveVoucher({ ...voucher, value: v ?? 0 })}
            />
            <button
              type="button"
              className={`admin-pill ${voucher.isActive ? "is-on" : "is-off"}`}
              onClick={() => toggleVoucherActive(voucher)}
            >
              {voucher.isActive ? "Aktyvus" : "Neaktyvus"}
            </button>
            <button
              type="button"
              className="admin-link is-danger"
              onClick={() => removeVoucher(voucher)}
            >
              Ištrinti
            </button>
          </div>
        ))}

        <div className="admin-row">
          <input
            value={newVoucher.code}
            placeholder="Naujas kodas (pvz. DOVANA30)"
            onChange={(e) => setNewVoucher((prev) => ({ ...prev, code: e.target.value }))}
          />
          <NumberInput
            min={0}
            step={0.01}
            value={newVoucher.value}
            onChange={(v) => setNewVoucher((prev) => ({ ...prev, value: v ?? 0 }))}
          />
        </div>
        {voucherError && <p className="admin-field-hint">{voucherError}</p>}
        <button type="button" className="admin-add" onClick={addVoucher}>
          + Pridėti kuponą
        </button>
      </section>
    </>
  );
}
