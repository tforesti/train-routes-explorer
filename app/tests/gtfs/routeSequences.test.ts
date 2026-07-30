import { assertEquals } from "@std/assert";
import { buildRouteSequences } from "../../src/gtfs/transform/routeSequences.ts";
import { groupStopTimesByTrip } from "../../src/gtfs/transform/tripStopSequences.ts";
import type { StopTimeRow, TripRow } from "../../src/gtfs/types.ts";

Deno.test("buildRouteSequences choisit le trip le plus long", () => {
  const trips: TripRow[] = [
    { route_id: "r1", trip_id: "t-short" },
    { route_id: "r1", trip_id: "t-long" },
  ];
  const stopTimes: StopTimeRow[] = [
    { trip_id: "t-short", stop_id: "s1", stop_sequence: "0" },
    { trip_id: "t-short", stop_id: "s2", stop_sequence: "1" },
    { trip_id: "t-long", stop_id: "s1", stop_sequence: "0" },
    { trip_id: "t-long", stop_id: "s2", stop_sequence: "1" },
    { trip_id: "t-long", stop_id: "s3", stop_sequence: "2" },
  ];
  const tripStops = groupStopTimesByTrip(stopTimes);
  const resolveStation = (stopId: string) => stopId;

  const result = buildRouteSequences(["r1"], trips, tripStops, resolveStation);

  assertEquals(result.get("r1"), ["s1", "s2", "s3"]);
});

Deno.test("buildRouteSequences retourne une séquence vide si aucun trip n'a d'arrêts", () => {
  const result = buildRouteSequences(["r2"], [], new Map(), (id) => id);

  assertEquals(result.get("r2"), []);
});
