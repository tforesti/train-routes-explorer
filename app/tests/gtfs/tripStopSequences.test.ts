import { assertEquals } from "@std/assert";
import { groupStopTimesByTrip } from "../../src/gtfs/transform/tripStopSequences.ts";
import type { StopTimeRow } from "../../src/gtfs/types.ts";

Deno.test("groupStopTimesByTrip groupe par trip et trie par stop_sequence", () => {
  const stopTimes: StopTimeRow[] = [
    { trip_id: "t1", stop_id: "s2", stop_sequence: "1" },
    { trip_id: "t2", stop_id: "s9", stop_sequence: "0" },
    { trip_id: "t1", stop_id: "s1", stop_sequence: "0" },
  ];

  const result = groupStopTimesByTrip(stopTimes);

  assertEquals(result.size, 2);
  assertEquals(result.get("t1")?.map((s) => s.stop_id), ["s1", "s2"]);
  assertEquals(result.get("t2")?.map((s) => s.stop_id), ["s9"]);
});
