import { serveDir } from "@std/http/file-server";
import { handleGetRoutes } from "./handlers/getRoutes.ts";
import { isPreflight, withCors } from "./cors.ts";

const STATIC_ROOT = new URL("../../web/dist", import.meta.url).pathname;

async function handler(request: Request): Promise<Response> {
  if (isPreflight(request)) {
    return withCors(new Response(null, { status: 204 }));
  }

  const url = new URL(request.url);

  if (url.pathname === "/api/routes") {
    const response = await handleGetRoutes(request);
    return withCors(response);
  }

  const response = await serveDir(request, { fsRoot: STATIC_ROOT, showDirListing: false });

  if (!url.pathname.startsWith("/assets/")) {
    response.headers.set("Cache-Control", "no-cache");
  }

  return response;
}

Deno.serve({ port: 8000 }, handler);
