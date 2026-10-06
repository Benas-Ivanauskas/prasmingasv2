import { Link, NavLink } from "react-router-dom";
import {
  IoHomeSharp,
  IoSearch,
  IoInformationCircleOutline,
  IoMailOutline,
} from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import "./Header.css";

export default function Header() {
  // If we're already on Home, the URL hash doesn't change on a repeat click
  // (same "#search-form" as before), so Home's hash-watching effect won't
  // re-fire — scroll directly here instead. When navigating in from another
  // page, this element won't exist yet, so this is a harmless no-op and
  // Home's own effect (on mount) handles the scroll instead.
  const scrollToSearchForm = () => {
    document.getElementById("search-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="header-wrapper">
      <div className="container header-container">
        <div className="header-brand">
          <NavLink to="/" className="brand-logo">
            VšĮ "Prasmingam gyvenimui"
          </NavLink>
        </div>

        <nav className="header-nav">
          <ul className="navbar-list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  <IoHomeSharp />
                </span>
                <span className="nav-label">Pagrindinis</span>
              </NavLink>
            </li>
            <li>
              {/* Plain Link, not NavLink — NavLink injects its own "active"
                  class whenever the pathname matches regardless of className,
                  and "/#search-form" shares a pathname with "/". This just
                  scrolls to the search form, it isn't really "a page". */}
              <Link to="/#search-form" className="nav-link" onClick={scrollToSearchForm}>
                <span className="nav-icon">
                  <IoSearch />
                </span>
                <span className="nav-label">Paieška</span>
              </Link>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  <IoInformationCircleOutline />
                </span>
                <span className="nav-label">Apie mus</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contacts"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  <IoMailOutline />
                </span>
                <span className="nav-label">Kontaktai</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="header-user">
          <NavLink to="/login" className="user-btn">
            <span className="user-icon">
              <FiUser />
            </span>
            <span className="user-label">Prisijungti</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
