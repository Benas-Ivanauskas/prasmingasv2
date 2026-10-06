import tuscanyBanner from "../../assets/tuscany-banner.jpg";
import "./Banner.css";

export default function Banner() {
  return (
    <section className="banner-section">
      <div className="container">
        <div className="banner-card">
          <img
            src={tuscanyBanner}
            alt="Toskana, Italija"
            className="banner-image"
          />
          <div className="banner-overlay" />
          <div className="banner-content">
            <h1 className="banner-title">Atraskite Italiją</h1>
            <p className="banner-subtitle">
              Toskana – saulė, vynas ir nepamirštami įspūdžiai
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
