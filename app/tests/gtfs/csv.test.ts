import { assertEquals } from "@std/assert";
import { parseCsv } from "../../src/gtfs/csv.ts";
import type { RouteRow } from "../../src/gtfs/types.ts";

Deno.test("parseCsv gère une virgule dans un champ entre guillemets", () => {
  const csv = `route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color
FR:Line::d1059242:,1187,E01,"Navettes Meuse TGV - Bar le Duc, Commercy et Verdun",,3,,,`;

  const rows = parseCsv<RouteRow>(csv);

  assertEquals(rows.length, 1);
  assertEquals(rows[0].route_short_name, "E01");
  assertEquals(rows[0].route_type, "3");
});
