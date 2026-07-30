import { readGtfsDir } from "../gtfs/readGtfs.ts";
import { composeIngestion } from "../gtfs/ingest.ts";
import { truncateAll, writeIngestionResult } from "../gtfs/writeToDb.ts";
import { closeDb, db } from "../db/client.ts";

function parseDirArg(args: string[]): string {
  const dirArg = args.find((arg) => arg.startsWith("--dir="));
  if (!dirArg) {
    console.error("Usage: deno task ingest -- --dir=<chemin vers un export GTFS>");
    Deno.exit(1);
  }
  return dirArg.slice("--dir=".length);
}

const dir = parseDirArg(Deno.args);
const raw = await readGtfsDir(dir);
const result = composeIngestion(raw);

await truncateAll(db);
await writeIngestionResult(db, result);

console.log(
  `Ingestion terminée : ${result.stations.length} stations, ${result.routes.length} routes, ${result.routeStations.length} route_stations.`,
);

await closeDb();
