import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import "./Admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/admin" className="admin-brand">
            Prasmingas · Administravimas
          </Link>
          <div className="admin-topbar-actions">
            <Link to="/" className="admin-topbar-link">
              ← Į svetainę
            </Link>
            <button type="button" className="admin-topbar-link admin-logout-btn" onClick={handleLogout}>
              Atsijungti
            </button>
          </div>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
