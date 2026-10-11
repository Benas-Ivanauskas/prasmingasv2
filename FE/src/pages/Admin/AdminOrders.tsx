import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminListOrders, adminCancelOrder } from "../../api/adminOrders";
import { downloadOrderInvoicePdf } from "../../api/trips";
import type { Order, OrderPaymentStatus, OrderStatus } from "../../types/order";

const PAYMENT_LABELS: Record<OrderPaymentStatus, string> = {
  DEPOSIT_PAID: "Depozitas apmokėtas",
  FULLY_PAID: "Pilnas mokėjimas",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  ACTIVE: "Aktyvus",
  COMPLETED: "Užbaigtas",
  CANCELLED: "Atšauktas",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [nameFilter, setNameFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [lookupInput, setLookupInput] = useState("");
  const [lookupError, setLookupError] = useState("");

  const reload = () => adminListOrders().then((list) => setOrders([...list]));

  useEffect(() => {
    let cancelled = false;
    adminListOrders().then((list) => {
      if (!cancelled) setOrders([...list]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (nameFilter && !order.clientName.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      if (
        orderNumberFilter &&
        !order.orderNumber.toLowerCase().includes(orderNumberFilter.toLowerCase())
      ) {
        return false;
      }
      const createdDate = order.createdAt.slice(0, 10);
      if (dateFrom && createdDate < dateFrom) return false;
      if (dateTo && createdDate > dateTo) return false;
      return true;
    });
  }, [orders, nameFilter, orderNumberFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setNameFilter("");
    setOrderNumberFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const cancelOrder = async (order: Order) => {
    if (!window.confirm(`Atšaukti užsakymą „${order.orderNumber}“?`)) return;
    await adminCancelOrder(order.id);
    reload();
  };

  const handleLookupDownload = () => {
    const query = lookupInput.trim().toUpperCase();
    if (!query) return;
    const order = orders.find(
      (o) => o.orderNumber.toUpperCase() === query || o.id.toUpperCase() === query
    );
    if (!order) {
      setLookupError("Užsakymas su tokiu numeriu/ID nerastas.");
      return;
    }
    setLookupError("");
    downloadOrderInvoicePdf(order);
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Užsakymai</h1>
          <p>Iš viso: {orders.length}</p>
        </div>
        <div className="admin-head-actions">
          <Link to="/admin/newsletter" className="admin-btn-ghost">
            Mokėjimų dokumentai
          </Link>
          <Link to="/admin/orders/new" className="btn-primary">
            + Naujas užsakymas (ranka)
          </Link>
          <Link to="/admin" className="admin-btn-ghost">
            ← Atgal į valdymą
          </Link>
        </div>
      </div>

      <section className="admin-card">
        <h3>PVM sąskaitos faktūros generavimas</h3>
        <p className="admin-field-hint">
          Įveskite užsakymo numerį (pvz.: ORD123) arba ID. Sistema sugeneruos PVM sąskaitą faktūrą
          ir iškart parsiųs PDF dokumentą.
        </p>
        <div className="admin-row">
          <input
            value={lookupInput}
            placeholder="Įveskite užsakymo numerį…"
            onChange={(e) => setLookupInput(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={handleLookupDownload}>
            Generuoti ir Atsisiųsti PDF
          </button>
        </div>
        {lookupError && <p className="admin-field-hint">{lookupError}</p>}
      </section>

      <section className="admin-card">
        <div className="admin-filter-bar">
          <label className="admin-field">
            <span className="admin-field-label">Vardas / Pavardė</span>
            <input
              value={nameFilter}
              placeholder="Ieškoti kliento…"
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Užsakymo Nr.</span>
            <input
              value={orderNumberFilter}
              placeholder="PVZ: ORD-123"
              onChange={(e) => setOrderNumberFilter(e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Data nuo</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Data iki</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <div className="admin-filter-actions">
            <button type="button" className="admin-btn-ghost" onClick={clearFilters}>
              Išvalyti
            </button>
          </div>
        </div>
      </section>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Užsakymo Nr.</th>
              <th>Klientas</th>
              <th>Telefonas</th>
              <th>Pastaba</th>
              <th>Mokėjimo būsena</th>
              <th>Būsena</th>
              <th>Sukurta</th>
              <th>Sukurta administratoriaus</th>
              <th>PDF</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, i) => (
              <tr key={order.id}>
                <td>{i + 1}</td>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <span className="admin-muted">{order.tripTitle}</span>
                </td>
                <td>{order.clientName}</td>
                <td>{order.phone}</td>
                <td>{order.note || "—"}</td>
                <td>
                  <span
                    className={`admin-pill ${order.paymentStatus === "FULLY_PAID" ? "is-on" : "is-off"}`}
                  >
                    {PAYMENT_LABELS[order.paymentStatus]}
                  </span>
                </td>
                <td>
                  <span className={`admin-pill ${order.status === "CANCELLED" ? "is-off" : "is-on"}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td>{order.createdAt.slice(0, 10)}</td>
                <td>{order.createdByAdmin ? "✓" : "—"}</td>
                <td>
                  <button
                    type="button"
                    className="admin-link"
                    onClick={() => downloadOrderInvoicePdf(order)}
                  >
                    PDF
                  </button>
                </td>
                <td className="admin-actions">
                  <button
                    type="button"
                    className="admin-link is-danger"
                    disabled={order.status === "CANCELLED"}
                    onClick={() => cancelOrder(order)}
                  >
                    Atšaukti
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={11} className="admin-empty">
                  Užsakymų nerasta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
