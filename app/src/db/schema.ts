import { pgTable, text, doublePrecision, integer, index, primaryKey } from "drizzle-orm/pg-core";

export const stations = pgTable("stations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
}, (table) => [
  index("idx_stations_lat_lon").on(table.lat, table.lon),
]);

export const routes = pgTable("routes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: integer("type").notNull(),
});

export const routeStations = pgTable("route_stations", {
  routeId: text("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  stationId: text("station_id").notNull().references(() => stations.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
}, (table) => [
  primaryKey({ columns: [table.routeId, table.sequence] }),
  index("idx_route_stations_route_id").on(table.routeId),
]);
