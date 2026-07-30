import type { StopRow } from "../types.ts";

export function buildStationResolver(stops: StopRow[]): (stopId: string) => string {
  const resolution = new Map<string, string>();
  for (const stop of stops) {
    resolution.set(stop.stop_id, stop.location_type === "1" ? stop.stop_id : stop.parent_station);
  }

  return (stopId: string) => {
    const stationId = resolution.get(stopId);
    if (stationId === undefined) {
      throw new Error(`stop_id inconnu dans stops.txt: ${stopId}`);
    }
    return stationId;
  };
}
