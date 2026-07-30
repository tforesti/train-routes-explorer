import { assertEquals } from "@std/assert";
import { routesToRoutes } from "../../src/gtfs/transform/routes.ts";
import type { RouteRow } from "../../src/gtfs/types.ts";

Deno.test("routesToRoutes filtre le rail strict, exclut tram-train et INCONNU, et mappe vers la forme table", () => {
  const rawRoutes: RouteRow[] = [
    { route_id: "r1", route_short_name: "TER123", route_long_name: "", route_type: "2" },
    { route_id: "r2", route_short_name: "C7", route_long_name: "Nantes - Châteaubriant", route_type: "0" },
    { route_id: "r3", route_short_name: "INCONNU", route_long_name: "-", route_type: "2" },
  ];

  const result = routesToRoutes(rawRoutes);

  assertEquals(result, [{ id: "r1", name: "TER123", type: 2 }]);
});
