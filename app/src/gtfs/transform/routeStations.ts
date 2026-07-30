import type { routeStations } from "../../db/schema.ts";

type RouteStationRow = typeof routeStations.$inferInsert;

export function toRouteStationRows(routeSequences: Map<string, string[]>): RouteStationRow[] {
  const rows: RouteStationRow[] = [];

  for (const [routeId, stationIds] of routeSequences) {
    stationIds.forEach((stationId, sequence) => {
      rows.push({ routeId, stationId, sequence });
    });
  }

  return rows;
}
