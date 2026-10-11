import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found-layout">
      <Header />

      <section className="not-found-page">
        <div className="container">
          <div className="not-found-card">
            <span className="not-found-code">404</span>
            <h1 className="not-found-title">Puslapis nerastas</h1>
            <p className="not-found-text">
              Atrodo, kad šis puslapis neegzistuoja arba buvo perkeltas kitur.
            </p>
            <Link to="/" className="btn-primary">
              Grįžti į pagrindinį puslapį
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
