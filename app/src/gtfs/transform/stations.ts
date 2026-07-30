import type { StopRow } from "../types.ts";
import type { stations } from "../../db/schema.ts";

type Station = typeof stations.$inferInsert;

export function stopsToStations(stops: StopRow[]): Station[] {
  return stops
    .filter((stop) => stop.location_type === "1")
    .map((stop) => ({
      id: stop.stop_id,
      name: stop.stop_name,
      lat: Number(stop.stop_lat),
      lon: Number(stop.stop_lon),
    }));
}
