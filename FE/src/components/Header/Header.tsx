import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  IoCallOutline,
  IoMailOutline,
  IoLogoFacebook,
  IoInformationCircleOutline,
  IoAppsOutline,
  IoBusOutline,
  IoAirplaneOutline,
  IoBoatOutline,
  IoCheckmarkCircleOutline,
  IoSnowOutline,
  IoSearch,
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";
import type { CategoryFilter } from "../MainCards/MainCard";
import "./Header.css";

// Kategorijų pilys — ta pati filtravimo logika, kuri anksčiau gyveno
// MainCard.tsx viduje (žr. ten), tik dabar pasiekiama iš BET KURIO
// puslapio per "/?category=X" URL parametrą (Header rodomas visur, o
// senas filtras gyveno tik Home vaiko komponente). Be skaičių prie
// kiekvieno punkto — vartotojo prašymu.
const CATEGORY_LINKS: { category: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { category: "ALL", label: "Visos kelionės", icon: <IoAppsOutline /> },
  { category: "BUS", label: "Autobusu", icon: <IoBusOutline /> },
  { category: "FLIGHT", label: "Lėktuvu", icon: <IoAirplaneOutline /> },
  { category: "CRUISE", label: "Kruizai", icon: <IoBoatOutline /> },
  { category: "GUARANTEED", label: "Garantuotos", icon: <IoCheckmarkCircleOutline /> },
  { category: "CHRISTMAS", label: "Kalėdinės ir naujametinės", icon: <IoSnowOutline /> },
];

export default function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Pilys gali būti "aktyvios" TIK Home puslapyje — kituose puslapiuose
  // (pvz. Kontaktai) URL tiesiog neturi ?category, bet tai nereiškia, kad
  // "Visos kelionės" ten kažkokia prasme pasirinkta.
  const activeCategory: CategoryFilter | null =
    location.pathname === "/" ? ((searchParams.get("category") as CategoryFilter) || "ALL") : null;

  // If we're already on Home, the URL hash doesn't change on a repeat click
  // (same "#paieska" as before), so Home's hash-watching effect won't
  // re-fire — scroll directly here instead. When navigating in from another
  // page, this element won't exist yet, so this is a harmless no-op and
  // Home's own effect (on mount) handles the scroll instead.
  const scrollToSearchForm = () => {
    document.getElementById("paieska")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Filtrų skydelis uždaromas paspaudus bet kur už jo/mygtuko ribų, ne
  // tik pačiame mygtuke — kitaip jis liktų atidarytas, kol vartotojas
  // paspaustų hamburger mygtuką pakartotinai.
  useEffect(() => {
    if (!isFiltersOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFiltersOpen]);

  // Pasikeitus puslapiui (pvz. paspaudus kategorijos nuorodą) skydelis
  // visada turi užsiverti, kad nepasiliktų atidarytas naujame puslapyje.
  // Render-time derived-state palyginimas (ne efektas) — ta pati technika
  // kaip MainCard.tsx::prevCategory, kurios reikalauja ESLint'o
  // react-hooks/set-state-in-effect taisyklė.
  const locationKey = `${location.pathname}${location.search}`;
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    setIsFiltersOpen(false);
  }

  return (
    <header className="header-wrapper">
      {/* Kontaktų juosta — telefonas/el.paštas/Facebook (tie patys duomenys
          kaip Footer.tsx) + Apie mus/Kontaktai (perkelta iš pagrindinės
          nav eilutės, kad joje liktų vietos kategorijų pilims). */}
      <div className="header-topbar">
        <div className="container header-topbar-inner">
          <div className="header-topbar-contacts">
            <a href="tel:+37065955770" className="header-topbar-item">
              <IoCallOutline aria-hidden="true" />
              <span>(+370) 659 55770</span>
            </a>
            <a href="mailto:info@prasmingas.lt" className="header-topbar-item">
              <IoMailOutline aria-hidden="true" />
              <span>info@prasmingas.lt</span>
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="header-topbar-item"
            >
              <IoLogoFacebook aria-hidden="true" />
              <span>Facebook</span>
            </a>
          </div>

          <div className="header-topbar-links">
            <Link to="/apie-mus" className="header-topbar-link">
              <IoInformationCircleOutline aria-hidden="true" />
              <span>Apie mus</span>
            </Link>
            <Link to="/kontaktai" className="header-topbar-link">
              <IoMailOutline aria-hidden="true" />
              <span>Kontaktai</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container header-container">
        <div className="header-brand">
          <Link to="/" className="brand-logo">
            VšĮ "Prasmingam gyvenimui"
          </Link>
        </div>

        <div className="header-right-group">
          <div className="header-filters" ref={filtersRef}>
            <button
              type="button"
              className={`filters-btn ${isFiltersOpen ? "is-open" : ""}`}
              aria-expanded={isFiltersOpen}
              aria-haspopup="true"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
            >
              {isFiltersOpen ? <IoCloseOutline aria-hidden="true" /> : <IoMenuOutline aria-hidden="true" />}
              <span>Filtrai</span>
            </button>

            <nav className={`filters-panel ${isFiltersOpen ? "is-open" : ""}`}>
              <ul className="navbar-list">
                {CATEGORY_LINKS.map(({ category, label, icon }) => (
                  <li key={category}>
                    <Link
                      to={category === "ALL" ? "/" : `/?category=${category}`}
                      className={`nav-link ${activeCategory === category ? "active" : ""}`}
                      onClick={() => setIsFiltersOpen(false)}
                    >
                      <span className="nav-icon">{icon}</span>
                      <span className="nav-label">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Link
            to="/#paieska"
            className="header-search-btn"
            onClick={scrollToSearchForm}
            aria-label="Paieška"
          >
            <IoSearch aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
