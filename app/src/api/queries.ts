import { eq } from "drizzle-orm";
import type { db } from "../db/client.ts";
import { routeStations, routes, stations } from "../db/schema.ts";
import type { RouteWithStations } from "./types.ts";

type Database = typeof db;

export async function getAllRoutes(database: Database): Promise<RouteWithStations[]> {
  const rows = await database
    .select({
      routeId: routes.id,
      routeName: routes.name,
      routeType: routes.type,
      stationId: stations.id,
      stationName: stations.name,
      lat: stations.lat,
      lon: stations.lon,
      sequence: routeStations.sequence,
    })
    .from(routeStations)
    .innerJoin(routes, eq(routeStations.routeId, routes.id))
    .innerJoin(stations, eq(routeStations.stationId, stations.id))
    .orderBy(routeStations.routeId, routeStations.sequence);

  const routesById = new Map<string, RouteWithStations>();
  for (const row of rows) {
    let entry = routesById.get(row.routeId);
    if (!entry) {
      entry = {
        route: { id: row.routeId, name: row.routeName, type: row.routeType },
        stations: [],
      };
      routesById.set(row.routeId, entry);
    }
    entry.stations.push({
      id: row.stationId,
      name: row.stationName,
      lat: row.lat,
      lon: row.lon,
      sequence: row.sequence,
    });
  }

  return Array.from(routesById.values());
}
