import type { RouteRow } from "../types.ts";
import type { routes } from "../../db/schema.ts";

type Route = typeof routes.$inferInsert;

export function routesToRoutes(rawRoutes: RouteRow[]): Route[] {
  return rawRoutes
    .filter((route) => route.route_type === "2" && route.route_short_name !== "INCONNU")
    .map((route) => ({
      id: route.route_id,
      name: route.route_short_name,
      type: Number(route.route_type),
    }));
}
