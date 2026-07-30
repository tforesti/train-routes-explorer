import type { StopTimeRow } from "../types.ts";

export function groupStopTimesByTrip(stopTimes: StopTimeRow[]): Map<string, StopTimeRow[]> {
  const byTrip = new Map<string, StopTimeRow[]>();

  for (const stopTime of stopTimes) {
    const group = byTrip.get(stopTime.trip_id);
    if (group) {
      group.push(stopTime);
    } else {
      byTrip.set(stopTime.trip_id, [stopTime]);
    }
  }

  for (const group of byTrip.values()) {
    group.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
  }

  return byTrip;
}
