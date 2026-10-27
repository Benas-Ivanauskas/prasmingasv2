import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminDeleteTrip, adminDuplicateTrip, adminListTrips, adminSaveTrip } from "../../api/adminTrips";
import type { Trip, TripType } from "../../types/trip";

const TYPE_LABELS: Record<TripType, string> = {
  BUS: "Autobusu",
  FLIGHT: "Lėktuvu",
  CRUISE: "Kruizas",
};

export default function AdminTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);

  const reload = () => adminListTrips().then((list) => setTrips([...list]));

  useEffect(() => {
    let cancelled = false;
    adminListTrips().then((list) => {
      if (!cancelled) setTrips([...list]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleActive = async (trip: Trip) => {
    await adminSaveTrip({ ...trip, isActive: !(trip.isActive ?? true) });
    reload();
  };

  const remove = async (trip: Trip) => {
    if (!window.confirm(`Ištrinti kelionę „${trip.title}“? Šio veiksmo atšaukti negalima.`)) return;
    await adminDeleteTrip(trip.id);
    reload();
  };

  const duplicate = async (trip: Trip) => {
    try {
      const created = await adminDuplicateTrip(trip.id);
      navigate(`/admin/trips/${created.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nepavyko dubliuoti kelionės");
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Kelionės</h1>
          <p>Iš viso: {trips.length}</p>
        </div>
        <Link to="/admin/trips/new" className="btn-primary">
          + Nauja kelionė
        </Link>
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pavadinimas</th>
              <th>Tipas</th>
              <th>Šalis</th>
              <th>Išvykimai</th>
              <th>Būsena</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => {
              const active = trip.isActive ?? true;
              // "Aktyvi" pilis yra RANKINIS trip.isActive laukas, ne
              // pasibaigusių išvykimų indikatorius — bet admin'ui naudinga
              // matyti, kai kelionė vis dar pažymėta "Aktyvi", bet NEBETURI
              // nė vieno ACTIVE išvykimo (viešai jau nerodoma dėl
              // trip.service.ts::buildTripWhere departures:{some:ACTIVE}
              // filtro, nors isActive=true). Grynai informacinė pastaba,
              // NIEKADA nekeičia paties isActive.
              const allDeparturesFinished =
                trip.departures.length > 0 && !trip.departures.some((d) => d.status === "ACTIVE");
              return (
                <tr key={trip.id}>
                  <td>
                    <strong>{trip.title}</strong>
                    <span className="admin-muted">/{trip.slug}</span>
                  </td>
                  <td>{TYPE_LABELS[trip.tripType]}</td>
                  <td>{trip.destinationCountry}</td>
                  <td>{trip.departures.length}</td>
                  <td>
                    <button
                      type="button"
                      className={`admin-pill ${active ? "is-on" : "is-off"}`}
                      onClick={() => toggleActive(trip)}
                    >
                      {active ? "Aktyvi" : "Paslėpta"}
                    </button>
                    {active && allDeparturesFinished && (
                      <div className="admin-muted">Visi išvykimai pasibaigę</div>
                    )}
                  </td>
                  <td className="admin-actions">
                    <div>
                    <Link to={`/kelione/${trip.slug}`} target="_blank" className="admin-link">
                      Peržiūrėti
                    </Link>
                    <Link to={`/admin/trips/${trip.id}`} className="admin-link">
                      Redaguoti
                    </Link>
                    <button type="button" className="admin-link" onClick={() => duplicate(trip)}>
                      Dubliuoti
                    </button>
                    <button type="button" className="admin-link is-danger" onClick={() => remove(trip)}>
                      Ištrinti
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {trips.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Kelionių dar nėra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
