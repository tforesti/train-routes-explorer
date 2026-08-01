import { db } from "../../db/client.ts";
import { getAllRoutes } from "../queries.ts";

export async function handleGetRoutes(_request: Request): Promise<Response> {
  const result = await getAllRoutes(db);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
