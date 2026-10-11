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
        <p>
          CSV eksportas bus galimas, kai prenumeratoriai bus renkami realiu
          laiku (reikalinga back-end integracija).
        </p>
        <button type="button" className="btn-primary" disabled>
          Atsisiųsti CSV
        </button>
      </section>
    </>
  );
}
