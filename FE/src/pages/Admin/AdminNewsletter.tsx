const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function AdminNewsletter() {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Naujienlaiškio eksportas</h1>
          <p>Atsisiųskite naujienlaiškio prenumeratorių sąrašą CSV formatu.</p>
        </div>
      </div>

      <section className="admin-card">
        <a href={`${API_URL}/api/admin/newsletter/export.csv`} className="btn-primary" style={{ display: "inline-block" }}>
          Atsisiųsti CSV
        </a>
      </section>
    </>
  );
}
