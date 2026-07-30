export interface RouteWithStations {
  route: { id: string; name: string; type: number }
  stations: { id: string; name: string; lat: number; lon: number; sequence: number }[]
}
