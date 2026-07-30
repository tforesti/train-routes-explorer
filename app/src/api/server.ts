import { handleGetRoutes } from "./handlers/getRoutes.ts";
import { isPreflight, withCors } from "./cors.ts";

async function handler(request: Request): Promise<Response> {
  if (isPreflight(request)) {
    return withCors(new Response(null, { status: 204 }));
  }

  const url = new URL(request.url);

  if (url.pathname === "/api/routes") {
    const response = await handleGetRoutes(request);
    return withCors(response);
  }

  return withCors(new Response("Not found", { status: 404 }));
}

Deno.serve({ port: 8000 }, handler);
