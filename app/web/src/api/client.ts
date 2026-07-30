import type { RouteWithStations } from '../types'

export async function fetchRoutes(): Promise<RouteWithStations[]> {
  const response = await fetch('/api/routes')
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`)
  }
  return response.json()
}
