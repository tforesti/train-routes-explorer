import { parseCsv } from "./csv.ts";
import type { RawGtfs, RouteRow, StopRow, StopTimeRow, TripRow } from "./types.ts";

export async function readGtfsDir(dirPath: string): Promise<RawGtfs> {
  const [routesText, tripsText, stopTimesText, stopsText] = await Promise.all([
    Deno.readTextFile(`${dirPath}/routes.txt`),
    Deno.readTextFile(`${dirPath}/trips.txt`),
    Deno.readTextFile(`${dirPath}/stop_times.txt`),
    Deno.readTextFile(`${dirPath}/stops.txt`),
  ]);

  return {
    routes: parseCsv<RouteRow>(routesText),
    trips: parseCsv<TripRow>(tripsText),
    stopTimes: parseCsv<StopTimeRow>(stopTimesText),
    stops: parseCsv<StopRow>(stopsText),
  };
}
