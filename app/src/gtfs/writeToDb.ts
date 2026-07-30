import { sql } from "drizzle-orm";
import type { db } from "../db/client.ts";
import { routeStations, routes, stations } from "../db/schema.ts";
import type { IngestionResult } from "./ingest.ts";

type Database = typeof db;

const CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function truncateAll(database: Database): Promise<void> {
  await database.execute(sql`TRUNCATE route_stations, routes, stations CASCADE`);
}

export async function insertStations(
  database: Database,
  rows: (typeof stations.$inferInsert)[],
): Promise<void> {
  for (const batch of chunk(rows, CHUNK_SIZE)) {
    await database.insert(stations).values(batch);
  }
}

export async function insertRoutes(
  database: Database,
  rows: (typeof routes.$inferInsert)[],
): Promise<void> {
  for (const batch of chunk(rows, CHUNK_SIZE)) {
    await database.insert(routes).values(batch);
  }
}

export async function insertRouteStations(
  database: Database,
  rows: (typeof routeStations.$inferInsert)[],
): Promise<void> {
  for (const batch of chunk(rows, CHUNK_SIZE)) {
    await database.insert(routeStations).values(batch);
  }
}

export async function writeIngestionResult(database: Database, result: IngestionResult): Promise<void> {
  await Promise.all([
    insertStations(database, result.stations),
    insertRoutes(database, result.routes),
  ]);
  await insertRouteStations(database, result.routeStations);
}
