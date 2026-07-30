import type { RawGtfs } from "./types.ts";
import { routesToRoutes } from "./transform/routes.ts";
import { stopsToStations } from "./transform/stations.ts";
import { buildStationResolver } from "./transform/stopResolution.ts";
import { groupStopTimesByTrip } from "./transform/tripStopSequences.ts";
import { buildRouteSequences } from "./transform/routeSequences.ts";
import { toRouteStationRows } from "./transform/routeStations.ts";
import type { routes, routeStations, stations } from "../db/schema.ts";

export interface IngestionResult {
  stations: (typeof stations.$inferInsert)[];
  routes: (typeof routes.$inferInsert)[];
  routeStations: (typeof routeStations.$inferInsert)[];
}

export function composeIngestion(raw: RawGtfs): IngestionResult {
  const filteredRoutes = routesToRoutes(raw.routes);
  const stationRows = stopsToStations(raw.stops);
  const resolveStation = buildStationResolver(raw.stops);
  const tripStops = groupStopTimesByTrip(raw.stopTimes);

  const routeIds = filteredRoutes.map((route) => route.id);
  const routeSequences = buildRouteSequences(routeIds, raw.trips, tripStops, resolveStation);
  const routeStationRows = toRouteStationRows(routeSequences);

  return {
    stations: stationRows,
    routes: filteredRoutes,
    routeStations: routeStationRows,
  };
}
