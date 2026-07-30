import { parse } from "@std/csv";

export function parseCsv<T>(text: string): T[] {
  return parse(text, { skipFirstRow: true }) as unknown as T[];
}
