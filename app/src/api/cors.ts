const ALLOWED_ORIGIN = "http://localhost:5173";

export function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export function isPreflight(request: Request): boolean {
  return request.method === "OPTIONS";
}
