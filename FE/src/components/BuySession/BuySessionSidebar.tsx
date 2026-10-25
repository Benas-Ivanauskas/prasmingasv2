import type { ReactNode } from "react";
import type { Trip } from "../../types/trip";
import { getScaledImageUrl } from "../../utils/tripHelpers";
import "./BuySessionSidebar.css";

interface BuySessionSidebarProps {
  trip: Trip;
  title?: string;
  routeLabel: string;
  dateLabel: string;
  selectionSummary?: string;
  formattedTotal: string;
  // Hides the standalone total line — for pages whose buttonLabel already
  // states the amount (e.g. "Apmokėti 515,30 €"), so the price isn't shown
  // twice right next to each other.
  hideTotalLine?: boolean;
  totalNote?: ReactNode;
  isValid: boolean;
  onContinue: () => void;
  buttonLabel?: string;
  // While true, the button shows a spinner instead of buttonLabel and is
  // disabled alongside isValid — prevents a slow/async onContinue (e.g.
  // Step 4's checkout call) from firing twice on a double-click.
  isLoading?: boolean;
  note?: string;
  // Extra content rendered between the selection summary and the total —
  // e.g. Step 4's coupon-code field. Omitted everywhere else.
  children?: ReactNode;
}

export default function BuySessionSidebar({
  trip,
  title = "Pasirinktos vietos",
  routeLabel,
  dateLabel,
  selectionSummary,
  formattedTotal,
  hideTotalLine = false,
  totalNote,
  isValid,
  onContinue,
  buttonLabel = "Toliau →",
  isLoading = false,
  note,
  children,
}: BuySessionSidebarProps) {
  const thumbnail = trip.images[0];

  return (
    <aside className="buy-session-sidebar">
      <div className="buy-session-sidebar-card">
        <h3>{title}</h3>

        <div className="buy-session-trip-preview">
          {thumbnail && (
            <img
              src={getScaledImageUrl(thumbnail.url, 200)}
              alt={thumbnail.alt || trip.title}
              className="buy-session-trip-thumb"
            />
          )}
          <div>
            <div className="buy-session-trip-title">{trip.title}</div>
            <div className="buy-session-trip-meta">{routeLabel}</div>
            <div className="buy-session-trip-meta">{dateLabel}</div>
          </div>
        </div>

        {selectionSummary && (
          <div className="buy-session-selection">{selectionSummary}</div>
        )}

        {children}

        {totalNote && <div className="buy-session-total-note">{totalNote}</div>}
        {!hideTotalLine && (
          <div className="buy-session-total">
            <span className="buy-session-total-value">{formattedTotal}</span>
          </div>
        )}

        <button
          type="button"
          className="btn-primary buy-session-continue"
          disabled={!isValid || isLoading}
          onClick={onContinue}
        >
          {isLoading ? (
            <>
              <span className="buy-session-continue-spinner" aria-hidden="true" />
              Apdorojama...
            </>
          ) : (
            buttonLabel
          )}
        </button>
        {note && <p className="buy-session-continue-note">{note}</p>}
      </div>
    </aside>
  );
}
