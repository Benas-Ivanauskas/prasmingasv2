import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentAdmin } from "../../api/auth";

// Apgaubia /admin/* route'us App.tsx. Patikrina sesiją per GET /api/auth/me
// prie kiekvieno mount'o (naujo tab'o/puslapio perkrovimo) — cookie pati
// savaime neatskleidžia BE, ar ji dar galioja, tad reikia paklausti serverio.
export default function RequireAuth() {
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const admin = await getCurrentAdmin();
        if (!cancelled) setStatus(admin ? "authed" : "anon");
      } catch {
        if (!cancelled) setStatus("anon");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "anon") {
    return <Navigate to="/prisijungti" replace />;
  }

  return <Outlet />;
}
