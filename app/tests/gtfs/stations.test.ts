import { assertEquals } from "@std/assert";
import { stopsToStations } from "../../src/gtfs/transform/stations.ts";
import type { StopRow } from "../../src/gtfs/types.ts";

Deno.test("stopsToStations ne garde que les gares mères (location_type=1)", () => {
  const stops: StopRow[] = [
    { stop_id: "StopArea:1", stop_name: "Gare A", stop_lat: "48.8566", stop_lon: "2.3522", location_type: "1", parent_station: "" },
    { stop_id: "StopPoint:1a", stop_name: "Gare A", stop_lat: "48.8566", stop_lon: "2.3522", location_type: "0", parent_station: "StopArea:1" },
  ];

  const result = stopsToStations(stops);

  assertEquals(result.length, 1);
  assertEquals(result[0], { id: "StopArea:1", name: "Gare A", lat: 48.8566, lon: 2.3522 });
});
