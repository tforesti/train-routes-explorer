import { assertEquals } from "@std/assert";
import { composeIngestion } from "../../src/gtfs/ingest.ts";
import type { RawGtfs } from "../../src/gtfs/types.ts";

Deno.test("composeIngestion assemble stations, routes et route_stations à partir du GTFS brut", () => {
  const raw: RawGtfs = {
    routes: [
      { route_id: "r1", route_short_name: "TER1", route_long_name: "", route_type: "2" },
      { route_id: "r2", route_short_name: "INCONNU", route_long_name: "-", route_type: "2" },
    ],
    trips: [
      { route_id: "r1", trip_id: "t1" },
    ],
    stopTimes: [
      { trip_id: "t1", stop_id: "StopPoint:1a", stop_sequence: "0" },
      { trip_id: "t1", stop_id: "StopArea:2", stop_sequence: "1" },
    ],
    stops: [
      { stop_id: "StopArea:1", stop_name: "Gare A", stop_lat: "48.8", stop_lon: "2.3", location_type: "1", parent_station: "" },
      { stop_id: "StopPoint:1a", stop_name: "Gare A", stop_lat: "48.8", stop_lon: "2.3", location_type: "0", parent_station: "StopArea:1" },
      { stop_id: "StopArea:2", stop_name: "Gare B", stop_lat: "45.7", stop_lon: "4.8", location_type: "1", parent_station: "" },
    ],
  };

  const result = composeIngestion(raw);

  assertEquals(result.routes, [{ id: "r1", name: "TER1", type: 2 }]);
  assertEquals(result.stations.length, 2);
  assertEquals(result.routeStations, [
    { routeId: "r1", stationId: "StopArea:1", sequence: 0 },
    { routeId: "r1", stationId: "StopArea:2", sequence: 1 },
  ]);
});
