import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const connectionString = Deno.env.get("DATABASE_URL");
if (!connectionString) {
  throw new Error("DATABASE_URL manquant dans l'environnement");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export function closeDb(): Promise<void> {
  return client.end();
}
