import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoTimeOutline, IoAlertCircleOutline } from "react-icons/io5";
import { formatCountdown } from "../../hooks/useCountdown";
import "./ReservationTimerBanner.css";

interface ReservationTimerBannerProps {
  // Absent entirely for FLIGHT bookings made before this trip type had a
  // hold concept, or any booking with no active hold — renders nothing.
  holdExpiresAt: number | undefined;
  secondsLeft: number;
  // Always Step 1 ("Kelionė") — once the hold expires, Step 1's own choices
  // (discount code validity, deposit deadline) may be stale too, so the
  // only safe recovery is a full restart, not just re-picking seats.
  restartUrl: string;
}

// Kiek laiko vartotojas turi perskaityti popup'ą/pačiam paspausti mygtuką,
// prieš automatiškai nukreipiant atgal į Step 1 — tęsti pildymą su jau
// pasibaigusiu hold'u vis tiek neturi prasmės, tad nelaukiame amžinai.
const AUTO_REDIRECT_MS = 6000;

// Shown on both Step 3 (Keleiviai) and Step 4 (Mokėjimas) — the reservation
// started back in Step 2 and has to stay visible for the whole window it
// covers, not just reappear once payment is reached.
export default function ReservationTimerBanner({
  holdExpiresAt,
  secondsLeft,
  restartUrl,
}: ReservationTimerBannerProps) {
  const navigate = useNavigate();
  const isExpired = Boolean(holdExpiresAt) && secondsLeft <= 0;
  const [showModal, setShowModal] = useState(false);
  // Užtikrina, kad popup'as parodomas TIK VIENĄ kartą (pirmą kartą pasiekus
  // isExpired), o ne kiekvieną kartą perrenderinus — vartotojas galėtų jį
  // uždaryti/paspausti nuorodą rankiniu būdu ir modalas neturėtų vėl
  // "iššokti" dėl kitų, nesusijusių state pasikeitimų tame pačiame puslapyje.
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isExpired || shownRef.current) return;
    shownRef.current = true;
    setShowModal(true);

    const timeout = setTimeout(() => navigate(restartUrl), AUTO_REDIRECT_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  if (!holdExpiresAt) return null;

  return (
    <>
      <div className={`reservation-timer${secondsLeft <= 120 ? " reservation-timer-low" : ""}`}>
        <IoTimeOutline aria-hidden="true" />
        {isExpired ? (
          <>
            Rezervacijos laikas baigėsi — <Link to={restartUrl}>pradėkite iš naujo</Link>
          </>
        ) : (
          <>
            Rezervacija galioja: <strong>{formatCountdown(secondsLeft)}</strong>
          </>
        )}
      </div>

      {showModal && (
        <div className="reservation-expired-modal">
          <div className="reservation-expired-backdrop" />
          <div className="reservation-expired-card" role="alertdialog" aria-live="assertive">
            <IoAlertCircleOutline aria-hidden="true" className="reservation-expired-icon" />
            <h3>Rezervacijos laikas baigėsi</h3>
            <p>
              Jūsų pasirinkta vieta/vietos jau atlaisvintos kitiems klientams. Tęsti šio užsakymo
              nebegalima — pradėkite rezervaciją iš naujo.
            </p>
            <button type="button" className="btn-primary" onClick={() => navigate(restartUrl)}>
              Grįžti į pradžią
            </button>
          </div>
        </div>
      )}
    </>
  );
}
