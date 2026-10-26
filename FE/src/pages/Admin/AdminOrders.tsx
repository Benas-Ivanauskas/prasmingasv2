import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminListOrders,
  adminCancelOrder,
  adminUpdateOrderPaymentStatus,
  adminSendRemainingPaymentLink,
} from "../../api/adminOrders";
import { downloadInvoicePdf, downloadContractPdf, downloadVatInvoicePdf } from "../../api/trips";
import Pagination from "../../components/MainCards/Pagination";
import type { Order, OrderPaymentStatus, OrderStatus } from "../../types/order";

const ORDERS_PER_PAGE = 40;

const INVOICE_TYPE_LABELS: Record<"FULL" | "DEPOSIT" | "REMAINING", string> = {
  FULL: "Pilna",
  DEPOSIT: "Avansas",
  REMAINING: "Likutis",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Dar neapmokėta",
  DEPOSIT_PAID: "Depozitas apmokėtas",
  FULLY_PAID: "Pilnai apmokėta",
  CANCELLED: "Atšauktas",
  EXPIRED: "Nebegalioja",
};

// PENDING_PAYMENT reiškia DU visiškai skirtingus atvejus — admin'o rankiniu
// būdu sukurtą užsakymą ("derybos", laukiama kliento patvirtinimo rankomis)
// ir REALŲ viešo checkout užsakymą, kuris tiesiog dar neatidarė Paysera
// webhook'o. Be šio atskyrimo abu atrodė identiškai, o "Pažymėti: apmokėta"
// mygtukai rodėsi ir realiam, webhook'o dar laukiančiam užsakymui — pavojinga.
function getStatusLabel(order: Order): string {
  if (order.status === "PENDING_PAYMENT" && !order.createdByAdmin) {
    return "Laukiama mokėjimo patvirtinimo";
  }
  return STATUS_LABELS[order.status];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [nameFilter, setNameFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [lookupInput, setLookupInput] = useState("");
  const [lookupError, setLookupError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const clearFilters = () => {
    setNameFilter("");
    setOrderNumberFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const cancelOrder = async (order: Order) => {
    if (!window.confirm(`Atšaukti užsakymą „${order.orderNumber}“?`)) return;
    try {
      await adminCancelOrder(order.id);
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nepavyko atšaukti užsakymo.");
    }
  };

  // Vieta/kajutė jau užimta nuo sukūrimo (žr. AdminOrderNew.tsx) — šitas
  // veiksmas tik patvirtina, kad pinigai realiai įkrito, niekaip
  // nepaliečia rezervacijos.
  const markPaid = async (order: Order, status: Exclude<OrderPaymentStatus, "PENDING_PAYMENT">) => {
    let depositAmount: number | undefined;
    if (status === "DEPOSIT_PAID") {
      const input = window.prompt(
        `Įveskite sumokėtą depozito sumą (€) užsakymui „${order.orderNumber}“:`,
        String(order.totalAmount)
      );
      if (input === null) return;
      const parsed = Number(input.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        window.alert("Neteisinga suma.");
        return;
      }
      depositAmount = parsed;
    }
    try {
      await adminUpdateOrderPaymentStatus(order.id, status, depositAmount);
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nepavyko atnaujinti mokėjimo būsenos.");
    }
  };

  const sendRemainingLink = async (order: Order) => {
    try {
      const result = await adminSendRemainingPaymentLink(order.id);
      if (result.sent) {
        window.alert("Laiškas išsiųstas.");
      } else {
        try {
          await navigator.clipboard.writeText(result.redirectUrl);
        } catch {
          // clipboard API gali būti nepasiekiamas (pvz. http/senas naršyklės leidimas) — nefatalu.
        }
        window.alert(
          "Laiško išsiųsti nepavyko (SMTP dar nesukonfigūruotas?). Nuoroda nukopijuota — persiųskite rankiniu būdu."
        );
      }
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nepavyko sukurti likusio mokėjimo nuorodos.");
    }
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
    downloadVatInvoicePdf(order.id);
  };

  return (
    <div className="admin-orders-page">
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
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Užsakymo Nr.</span>
            <input
              value={orderNumberFilter}
              placeholder="PVZ: ORD-123"
              onChange={(e) => {
                setOrderNumberFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Data nuo</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Data iki</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
            />
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
              <th>Būsena</th>
              <th>Sukurta</th>
              <th>Sukurta administratoriaus</th>
              <th>PVM sąskaita</th>
              <th>Išankstinė sąskaita</th>
              <th>Kelionės sutartis</th>
              <th>PVM sąskaita faktūra</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order, i) => (
              <tr key={order.id}>
                <td>{(currentPage - 1) * ORDERS_PER_PAGE + i + 1}</td>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <span className="admin-muted">{order.tripTitle}</span>
                </td>
                <td>{order.clientName}</td>
                <td>{order.phone}</td>
                <td className="admin-table-wrap-cell">{order.note || "—"}</td>
                <td>
                  <span
                    className={`admin-pill ${
                      order.status === "CANCELLED" || order.status === "EXPIRED" ? "is-off" : "is-on"
                    }`}
                  >
                    {getStatusLabel(order)}
                  </span>
                  {order.status === "DEPOSIT_PAID" && (
                    <div className="admin-muted">
                      {order.remainingPaymentStatus == null &&
                        "Likusio mokėjimo nuoroda dar nesiųsta"}
                      {order.remainingPaymentStatus === "PENDING" &&
                        "Likusio mokėjimo nuoroda išsiųsta — laukiama apmokėjimo"}
                      {(order.remainingPaymentStatus === "FAILED" ||
                        order.remainingPaymentStatus === "CANCELLED") &&
                        "Paskutinis bandymas nepavyko — pabandykite dar kartą"}
                    </div>
                  )}
                </td>
                <td>{order.createdAt.slice(0, 10)}</td>
                <td>{order.createdByAdmin ? "✓" : "—"}</td>
                <td>{order.wantsInvoice ? "✓ Prašoma" : "—"}</td>
                <td>
                  {order.completedPaymentTypes.length === 0 ? (
                    "—"
                  ) : (
                    order.completedPaymentTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="admin-link"
                        onClick={() => downloadInvoicePdf(order.id, type)}
                      >
                        {INVOICE_TYPE_LABELS[type]}
                      </button>
                    ))
                  )}
                </td>
                <td>
                  {order.completedPaymentTypes.includes("FULL") || order.completedPaymentTypes.includes("DEPOSIT") ? (
                    <button type="button" className="admin-link" onClick={() => downloadContractPdf(order.id)}>
                      Sutartis
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-link"
                    onClick={() => downloadVatInvoicePdf(order.id)}
                  >
                    PDF
                  </button>
                </td>
                <td className="admin-actions">
                  <div>
                    {/* Rankinis "pažymėti apmokėta" TIK admin'o pačio sukurtiems
                        užsakymams — realiam viešo checkout užsakymui statusą
                        keičia IŠIMTINAI Paysera webhook'as (žr. BE apsaugą
                        adminOrder.service.ts::updateAdminOrderPaymentStatus). */}
                    {order.status === "PENDING_PAYMENT" && order.createdByAdmin && (
                      <>
                        <button type="button" className="admin-link" onClick={() => markPaid(order, "FULLY_PAID")}>
                          Pažymėti: pilnai apmokėta
                        </button>
                        <button
                          type="button"
                          className="admin-link"
                          onClick={() => markPaid(order, "DEPOSIT_PAID")}
                        >
                          Pažymėti: depozitas apmokėtas
                        </button>
                      </>
                    )}
                    {order.status === "DEPOSIT_PAID" && (
                      <button type="button" className="admin-link" onClick={() => sendRemainingLink(order)}>
                        Siųsti likusio mokėjimo nuorodą
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-link is-danger"
                      disabled={order.status === "CANCELLED" || order.status === "EXPIRED"}
                      onClick={() => cancelOrder(order)}
                    >
                      Atšaukti
                    </button>
                  </div>
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

      <div className="admin-card admin-pagination-card">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={ORDERS_PER_PAGE}
          itemLabel="užsakymų"
          ariaLabel="Užsakymų puslapiai"
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
