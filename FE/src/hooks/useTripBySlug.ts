import { useEffect, useState } from "react";
import { fetchTripBySlug } from "../api/trips";
import type { Trip, Departure } from "../types/trip";
import { getTripDepartures } from "../utils/tripHelpers";

export type TripLookupStatus = "loading" | "trip-not-found" | "departure-not-found" | "ready";

interface UseTripBySlugResult {
  trip: Trip | null;
  departure: Departure | undefined;
  status: TripLookupStatus;
}

// Every page that resolves a trip (and often one specific departure) from
// the URL used to repeat this fetch/loading-state boilerplate on its own —
// shared here instead. Omit departureId (e.g. the trip detail page, which
// manages its own selected-departure state) to only gate on the trip.
export function useTripBySlug(
  slug: string | undefined,
  departureId?: string
): UseTripBySlugResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  // Tracks which slug `trip` actually reflects, so "loading" is derived
  // (not a separate state to fall out of sync) — see react-hooks/set-state-in-effect.
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    fetchTripBySlug(slug).then((data) => {
      if (cancelled) return;
      setTrip(data ?? null);
      setResolvedSlug(slug);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isLoading = resolvedSlug !== slug;
  const departure = trip ? getTripDepartures(trip).find((d) => d.id === departureId) : undefined;

  let status: TripLookupStatus;
  if (isLoading) status = "loading";
  else if (!trip) status = "trip-not-found";
  else if (departureId && !departure) status = "departure-not-found";
  else status = "ready";

  return { trip, departure, status };
}
