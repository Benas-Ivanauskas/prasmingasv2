import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { IoCloseCircleOutline } from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { cancelPendingOrder } from "../../api/trips";
// Reuses BuySuccess.css's card pattern (.success-page/.success-card/...) —
// same cross-file CSS import convention already used elsewhere (e.g.
// AdminOrderNew.tsx importing BuyOneSession.css) instead of duplicating it.
import "./BuySuccess.css";
import "./BuyCancelled.css";

// Paysera's cancelurl landing — a REAL external redirect (the browser left
// the SPA entirely at checkout), not a client-side navigation, so this reads
// orderId from the URL query string rather than router state.
export default function BuyCancelled() {
  const { slug, departureId } = useParams<{ slug: string; departureId: string }>();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      // Fire-and-forget — non-fatal either way, a still-PENDING_PAYMENT
      // order left behind here just expires on its own via Fazė 8's cron.
      cancelPendingOrder(orderId).catch(() => {});
    }
  }, [orderId]);

  return (
    <>
      <Header />

      <section className="success-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon cancelled-icon" aria-hidden="true">
              <IoCloseCircleOutline />
            </div>

            <h1 className="success-title">Mokėjimas atšauktas</h1>
            <p className="success-text">
              Jūsų rezervacija atšaukta — vietos/kajutės atlaisvintos. Galite pasirinkti iš naujo,
              jei norite tęsti užsakymą.
            </p>

            <Link to={`/buy/${slug}/${departureId}`} className="btn-primary success-cta">
              ← Pasirinkti vietas iš naujo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
