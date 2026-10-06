import { Link } from "react-router-dom";
import { IoTimeOutline } from "react-icons/io5";
import { formatCountdown } from "../../hooks/useCountdown";
import "./ReservationTimerBanner.css";

interface ReservationTimerBannerProps {
  // Absent entirely for FLIGHT bookings made before this trip type had a
  // hold concept, or any booking with no active hold — renders nothing.
  holdExpiresAt: number | undefined;
  secondsLeft: number;
  seatsPickerUrl: string;
}

// Shown on both Step 3 (Keleiviai) and Step 4 (Mokėjimas) — the reservation
// started back in Step 2 and has to stay visible for the whole window it
// covers, not just reappear once payment is reached.
export default function ReservationTimerBanner({
  holdExpiresAt,
  secondsLeft,
  seatsPickerUrl,
}: ReservationTimerBannerProps) {
  if (!holdExpiresAt) return null;

  const isExpired = secondsLeft <= 0;

  return (
    <div className={`reservation-timer${secondsLeft <= 120 ? " reservation-timer-low" : ""}`}>
      <IoTimeOutline aria-hidden="true" />
      {isExpired ? (
        <>
          Rezervacijos laikas baigėsi — <Link to={seatsPickerUrl}>pasirinkite vietas iš naujo</Link>
        </>
      ) : (
        <>
          Rezervacija galioja: <strong>{formatCountdown(secondsLeft)}</strong>
        </>
      )}
    </div>
  );
}
