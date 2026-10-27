import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LEGAL_LINKS } from "../../constants/legalLinks";
import {
  IoCallOutline,
  IoMailOutline,
  IoLogoFacebook,
  IoLogoInstagram,
} from "react-icons/io5";
import "./Footer.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="footer-wrapper">
      <div className="footer-newsletter">
        <div className="container footer-newsletter-inner">
          <h2 className="footer-newsletter-title">
            Prenumeruokite mūsų naujienlaiškį
          </h2>
          {status === "success" ? (
            <p className="footer-newsletter-success">Ačiū! Užsiprenumeravote sėkmingai.</p>
          ) : (
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Įrašykite Jūsų el. adresą"
                aria-label="El. pašto adresas"
                className="footer-newsletter-input"
              />
              <button type="submit" className="footer-newsletter-btn" disabled={status === "submitting"}>
                {status === "submitting" ? "Siunčiama..." : "Prenumeruoti"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="footer-newsletter-error">Nepavyko užsiprenumeruoti. Patikrinkite el. paštą ir bandykite dar kartą.</p>
          )}
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
            <NavLink to="/apie-mus" className="footer-link">
              Apie mus
            </NavLink>
            <NavLink to="/kontaktai" className="footer-link">
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
            <a
              href={LEGAL_LINKS.cookiePolicy}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Slapukų politika
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
