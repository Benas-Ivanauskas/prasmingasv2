import { NavLink } from "react-router-dom";
import { LEGAL_LINKS } from "../../constants/legalLinks";
import {
  IoCallOutline,
  IoMailOutline,
  IoLogoFacebook,
  IoLogoInstagram,
} from "react-icons/io5";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-wrapper">
      <div className="footer-newsletter">
        <div className="container footer-newsletter-inner">
          <h2 className="footer-newsletter-title">
            Prenumeruokite mūsų naujienlaiškį
          </h2>
          <form
            className="footer-newsletter-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Įrašykite Jūsų el. adresą"
              aria-label="El. pašto adresas"
              className="footer-newsletter-input"
            />
            <button type="submit" className="footer-newsletter-btn">
              Prenumeruoti
            </button>
          </form>
        </div>
      </div>

      <div className="footer-main">
        <div className="container footer-columns">
          <div className="footer-col footer-brand">
            <h3 className="footer-brand-title">VšĮ "Prasmingam gyvenimui"</h3>
            <p className="footer-brand-tagline">
              Kelionės autobusu - Jūsų Prasmingam gyvenimui
            </p>
            <p className="footer-brand-highlight">
              Džiaugiamės, kad domitės mūsų pasiūlymais!
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Susisiekime</h4>
            <a href="tel:+37065955770" className="footer-contact-link">
              <IoCallOutline aria-hidden="true" />
              <span>(+370) 659 55770</span>
            </a>
            <a href="mailto:info@prasmingas.lt" className="footer-contact-link">
              <IoMailOutline aria-hidden="true" />
              <span>info@prasmingas.lt</span>
            </a>

            <div className="footer-socials">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer-social-icon"
              >
                <IoLogoFacebook aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer-social-icon"
              >
                <IoLogoInstagram aria-hidden="true" />
              </a>
            </div>

            <div className="footer-hours">
              <span className="footer-hours-title">Darbo laikas:</span>
              <span>I-V 10-14 val.</span>
              <span>VI-VII nedirbame</span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Struktūra</h4>
            <NavLink to="/about" className="footer-link">
              Apie mus
            </NavLink>
            <NavLink to="/contacts" className="footer-link">
              Kontaktai
            </NavLink>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Informacija</h4>
            <a
              href={LEGAL_LINKS.tourismTerms}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Turizmo paslaugų sutartis
            </a>
            <a
              href={LEGAL_LINKS.privacyPolicy}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Privatumo politika
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="footer-copyright">
            © {currentYear} Prasmingas. Visos teisės saugomos.
          </p>
        </div>
      </div>
    </footer>
  );
}
