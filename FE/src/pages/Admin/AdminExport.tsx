import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminListTrips } from "../../api/adminTrips";
import type { Trip } from "../../types/trip";
import { formatTripDate } from "../../utils/tripHelpers";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function AdminExport() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState("");
  const [departureId, setDepartureId] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminListTrips().then((list) => {
      if (!cancelled) setTrips(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trip = trips.find((t) => t.id === tripId);
  const downloadUrl = departureId ? `${API_URL}/api/admin/departures/${departureId}/export.csv` : undefined;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Keleivių CSV eksportas</h1>
          <p>Pasirinkite kelionę ir jos išvykimo datą — atsisiųskite visų to išvykimo keleivių sąrašą CSV formatu.</p>
        </div>
        <Link to="/admin" className="admin-btn-ghost">
          ← Atgal į valdymą
        </Link>
      </div>

      <section className="admin-card">
        <div className="admin-grid">
          <label className="admin-field">
            <span className="admin-field-label">Kelionė *</span>
            <select
              value={tripId}
              onChange={(e) => {
                setTripId(e.target.value);
                setDepartureId("");
              }}
            >
              <option value="">Pasirinkite…</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Išvykimas *</span>
            <select
              value={departureId}
              onChange={(e) => setDepartureId(e.target.value)}
              disabled={!trip}
            >
              <option value="">Pasirinkite…</option>
              {trip?.departures.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatTripDate(d.date)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {downloadUrl ? (
          <a href={downloadUrl} className="btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
            Atsisiųsti CSV
          </a>
        ) : (
          <button type="button" className="btn-primary" disabled style={{ marginTop: "1rem" }}>
            Atsisiųsti CSV
          </button>
        )}
      </section>
    </>
  );
}
