import { useEffect, useState } from "react";

function secondsUntil(epochMs: number): number {
  return Math.max(0, Math.round((epochMs - Date.now()) / 1000));
}

// Recomputed from the real deadline each tick (not decremented), so it
// can't drift — and seeded from it on the first render too, instead of
// starting at 0 and jumping a second later.
export function useCountdown(expiresAt: number | undefined): number {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    expiresAt ? secondsUntil(expiresAt) : 0
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setSecondsLeft(secondsUntil(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
