import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Administravimas</h1>
          <p>Pasirinkite sritį, kurią norite tvarkyti.</p>
        </div>
      </div>

      <div className="admin-section-grid">
        <Link to="/admin/trips" className="admin-section-card">
          <h3>Kelionės</h3>
          <p>Peržiūrėti, redaguoti ir tvarkyti keliones</p>
        </Link>
        <Link to="/admin/orders" className="admin-section-card">
          <h3>Užsakymai</h3>
          <p>Peržiūrėti užsakymus, generuoti sąskaitas, atšaukti keliones</p>
        </Link>
        <Link to="/admin/discounts" className="admin-section-card">
          <h3>Nuolaidos</h3>
          <p>Tvarkyti nuolaidų kodus</p>
        </Link>
        <Link to="/admin/newsletter" className="admin-section-card">
          <h3>Naujienlaiškio eksportas</h3>
          <p>Atsisiųsti prenumeratorių sąrašą CSV formatu</p>
        </Link>
        <Link to="/admin/audit-log" className="admin-section-card">
          <h3>Veiksmų žurnalas</h3>
          <p>Kas ir kada sukūrė/redagavo/ištrynė keliones ir nuolaidų kodus</p>
        </Link>
      </div>
    </>
  );
}
