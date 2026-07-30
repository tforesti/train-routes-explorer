<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Map as MaplibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchRoutes } from '../api/client'
import type { RouteWithStations } from '../types'

const mapContainer = ref<HTMLDivElement | null>(null)

function toStationsGeoJson(routes: RouteWithStations[]): GeoJSON.FeatureCollection {
  const stationsById = new Map<string, GeoJSON.Feature>()

  for (const { stations } of routes) {
    for (const station of stations) {
      if (!stationsById.has(station.id)) {
        stationsById.set(station.id, {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [station.lon, station.lat] },
          properties: { id: station.id, name: station.name },
        })
      }
    }
  }

  return { type: 'FeatureCollection', features: Array.from(stationsById.values()) }
}

function toRoutesGeoJson(routes: RouteWithStations[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map(({ route, stations }) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: stations
          .slice()
          .sort((a, b) => a.sequence - b.sequence)
          .map((station) => [station.lon, station.lat]),
      },
      properties: { id: route.id, name: route.name },
    })),
  }
}

onMounted(async () => {
  if (!mapContainer.value) return

  const map = new MaplibreMap({
    container: mapContainer.value,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [2.35, 46.6],
    zoom: 5,
  })

  const routes = await fetchRoutes()

  map.on('load', () => {
    map.addSource('routes', { type: 'geojson', data: toRoutesGeoJson(routes) })
    map.addLayer({
      id: 'routes-layer',
      type: 'line',
      source: 'routes',
      paint: { 'line-color': '#0074D9', 'line-width': 2 },
    })

    map.addSource('stations', { type: 'geojson', data: toStationsGeoJson(routes) })
    map.addLayer({
      id: 'stations-layer',
      type: 'circle',
      source: 'stations',
      paint: { 'circle-radius': 3, 'circle-color': '#FF4136' },
    })
  })
})
</script>

<template>
  <div ref="mapContainer" class="map-container" />
</template>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
}
</style>
