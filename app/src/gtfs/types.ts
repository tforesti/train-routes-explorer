export interface RouteRow {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
}

export interface TripRow {
  route_id: string;
  trip_id: string;
}

export interface StopTimeRow {
  trip_id: string;
  stop_id: string;
  stop_sequence: string;
}

export interface StopRow {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type: string;
  parent_station: string;
}

export interface RawGtfs {
  routes: RouteRow[];
  trips: TripRow[];
  stopTimes: StopTimeRow[];
  stops: StopRow[];
}
