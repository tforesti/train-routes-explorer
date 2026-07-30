import type { StopTimeRow, TripRow } from "../types.ts";

export function buildRouteSequences(
  routeIds: string[],
  trips: TripRow[],
  tripStops: Map<string, StopTimeRow[]>,
  resolveStation: (stopId: string) => string,
): Map<string, string[]> {
  const tripsByRoute = new Map<string, TripRow[]>();
  for (const trip of trips) {
    const group = tripsByRoute.get(trip.route_id);
    if (group) {
      group.push(trip);
    } else {
      tripsByRoute.set(trip.route_id, [trip]);
    }
  }

  const sequences = new Map<string, string[]>();

  for (const routeId of routeIds) {
    const routeTrips = tripsByRoute.get(routeId) ?? [];

    let longestStops: StopTimeRow[] = [];
    for (const trip of routeTrips) {
      const stops = tripStops.get(trip.trip_id) ?? [];
      if (stops.length > longestStops.length) {
        longestStops = stops;
      }
    }

    if (longestStops.length === 0) {
      console.warn(`Route sans séquence de gares (aucun trip avec arrêts) : ${routeId}`);
    }

    sequences.set(routeId, longestStops.map((stop) => resolveStation(stop.stop_id)));
  }

  return sequences;
}
