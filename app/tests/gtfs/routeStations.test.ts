import { assertEquals } from "@std/assert";
import { toRouteStationRows } from "../../src/gtfs/transform/routeStations.ts";

Deno.test("toRouteStationRows aplatit la map en lignes renumérotées à partir de 0", () => {
  const sequences = new Map<string, string[]>([
    ["r1", ["s1", "s2", "s3"]],
    ["r2", ["s9"]],
  ]);

  const rows = toRouteStationRows(sequences);

  assertEquals(rows, [
    { routeId: "r1", stationId: "s1", sequence: 0 },
    { routeId: "r1", stationId: "s2", sequence: 1 },
    { routeId: "r1", stationId: "s3", sequence: 2 },
    { routeId: "r2", stationId: "s9", sequence: 0 },
  ]);
});
