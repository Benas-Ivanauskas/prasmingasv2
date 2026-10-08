import { Link } from "react-router-dom";
import {
  IoBusOutline,
  IoGiftOutline,
  IoRestaurantOutline,
  IoPeopleOutline,
  IoCallOutline,
  IoMailOutline,
  IoTimeOutline,
  IoLocationOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import aboutImage from "../../assets/tuscany-banner.jpg";
import "./About.css";

const HIGHLIGHTS = [
  {
    icon: IoBusOutline,
    title: "Kelionės autobusu",
    text: "Keliones organizuojame po Lietuvą ir į kaimynines šalis – Lenkiją, Latviją, Estiją.",
  },
  {
    icon: IoRestaurantOutline,
    title: "Pažintinės kelionės",
    text: "Muziejai, kultūros paveldas, skonių degustacijos ir kitos prasmingos patirtys kelyje.",
  },
  {
    icon: IoGiftOutline,
    title: "Šventinės kelionės",
    text: "Kalėdinės ir Naujųjų metų išvykos, kuriose šventinė nuotaika prasideda dar kelyje.",
  },
  {
    icon: IoPeopleOutline,
    title: "Grupėms ir pavieniams",
    text: "Keliauti galite su draugais, šeima ar bendraminčiais, o grupėms išvykas pritaikome individualiai.",
  },
];

const DETAILS = [
  { label: "Įmonės kodas", value: "305809635" },
  { label: "PVM mokėtojo kodas", value: "LT100016276316" },
  { label: "Vadovas", value: "Asta Juškienė" },
];

export default function About() {
  return (
    <>
      <Header />

      <section className="about-page">
        <div className="container">
          <div className="about-hero" style={{ backgroundImage: `url(${aboutImage})` }}>
            <div className="about-hero-content">
              <span className="about-eyebrow">Apie mus</span>
              <h1>Kelionės, skirtos Jūsų prasmingam gyvenimui</h1>
              <p>
                Esame VšĮ „Prasmingam gyvenimui“ – kelionių organizatorius. Rūpinamės maršrutu,
                nakvynėmis ir patogia kelione, kad Jums tereikėtų atsipalaiduoti ir mėgautis.
              </p>
              <Link to="/" className="btn-primary about-cta">
                Peržiūrėti keliones
              </Link>
            </div>
          </div>

          <h2 className="about-section-title">Ką veikiame</h2>
          <div className="about-highlights">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="about-highlight">
                <span className="about-highlight-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="about-info">
            <div className="about-details">
              <span className="about-panel-eyebrow">Rekvizitai</span>
              <h3 className="about-company">VšĮ „Prasmingam gyvenimui“</h3>
              <div className="about-detail-list">
                {DETAILS.map(({ label, value }) => (
                  <div key={label} className="about-detail">
                    <span className="about-detail-label">{label}</span>
                    <span className="about-detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-contact">
              <span className="about-panel-eyebrow">Kontaktai</span>
              <h3 className="about-company">Susisiekite</h3>
              <div className="about-contact-row">
                <span className="about-contact-icon">
                  <IoLocationOutline aria-hidden="true" />
                </span>
                <span>Vytauto g. 131-4, Garliava, LT-53210 Kauno r.</span>
              </div>
              <a className="about-contact-row" href="tel:+37065955770">
                <span className="about-contact-icon">
                  <IoCallOutline aria-hidden="true" />
                </span>
                <span>+370 659 55770</span>
              </a>
              <a className="about-contact-row" href="mailto:info@prasmingas.lt">
                <span className="about-contact-icon">
                  <IoMailOutline aria-hidden="true" />
                </span>
                <span>info@prasmingas.lt</span>
              </a>
              <div className="about-contact-row">
                <span className="about-contact-icon">
                  <IoTimeOutline aria-hidden="true" />
                </span>
                <span>I–V 10:00–14:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
