import { Link, Outlet } from "react-router-dom";
import "./Admin.css";

// Separate shell from the public site (no Header/Footer). Nothing protects
// these routes yet, so the backend/auth step needs to gate /admin/* before
// this goes anywhere public.
export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/admin" className="admin-brand">
            Prasmingas · Administravimas
          </Link>
          <Link to="/" className="admin-topbar-link">
            ← Į svetainę
          </Link>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
