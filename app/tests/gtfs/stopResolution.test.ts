import { assertEquals, assertThrows } from "@std/assert";
import { buildStationResolver } from "../../src/gtfs/transform/stopResolution.ts";
import type { StopRow } from "../../src/gtfs/types.ts";

Deno.test("buildStationResolver résout les enfants vers leur gare mère", () => {
  const stops: StopRow[] = [
    { stop_id: "StopArea:1", stop_name: "Gare A", stop_lat: "48.8", stop_lon: "2.3", location_type: "1", parent_station: "" },
    { stop_id: "StopPoint:1a", stop_name: "Gare A", stop_lat: "48.8", stop_lon: "2.3", location_type: "0", parent_station: "StopArea:1" },
  ];
  const resolve = buildStationResolver(stops);

  assertEquals(resolve("StopArea:1"), "StopArea:1");
  assertEquals(resolve("StopPoint:1a"), "StopArea:1");
});

Deno.test("buildStationResolver lève une erreur sur un stop_id inconnu", () => {
  const resolve = buildStationResolver([]);
  assertThrows(() => resolve("inconnu"));
});
