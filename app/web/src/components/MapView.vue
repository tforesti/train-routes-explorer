<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Map as MaplibreMap, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchRoutes } from '../api/client'
import type { RouteWithStations } from '../types'

const mapContainer = ref<HTMLDivElement | null>(null)

function toStationsGeoJson(routes: RouteWithStations[]): GeoJSON.FeatureCollection {
  const stationsById = new Map<string, { name: string; lat: number; lon: number; routeNames: Set<string> }>()

  for (const { route, stations } of routes) {
    for (const station of stations) {
      const existing = stationsById.get(station.id)
      if (existing) {
        existing.routeNames.add(route.name)
      } else {
        stationsById.set(station.id, {
          name: station.name,
          lat: station.lat,
          lon: station.lon,
          routeNames: new Set([route.name]),
        })
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: Array.from(stationsById.entries()).map(([id, station]) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [station.lon, station.lat] },
      properties: {
        id,
        name: station.name,
        routeNames: Array.from(station.routeNames).join(', '),
      },
    })),
  }
}

function toRoutesGeoJson(routes: RouteWithStations[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map(({ route, stations }) => {
      const ordered = stations.slice().sort((a, b) => a.sequence - b.sequence)
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: ordered.map((station) => [station.lon, station.lat]),
        },
        properties: {
          id: route.id,
          name: route.name,
          origin: ordered[0]?.name ?? '',
          destination: ordered[ordered.length - 1]?.name ?? '',
        },
      }
    }),
  }
}

onMounted(async () => {
  if (!mapContainer.value) return

  const map = new MaplibreMap({
    container: mapContainer.value,
    style: 'https://tiles.openfreemap.org/styles/liberty',
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
    map.addLayer({
      id: 'stations-labels',
      type: 'symbol',
      source: 'stations',
      minzoom: 8,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#111111',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    })

    const popup = new Popup({ closeButton: false, closeOnClick: false })

    map.on('mouseenter', 'stations-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return
      const properties = feature.properties as { name: string; routeNames: string }
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number]
      popup
        .setLngLat(coordinates)
        .setHTML(`<strong>${properties.name}</strong><br>${properties.routeNames}`)
        .addTo(map)
    })

    map.on('mouseleave', 'stations-layer', () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    })

    map.on('mouseenter', 'routes-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return
      const properties = feature.properties as { name: string; origin: string; destination: string }
      popup
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${properties.name}</strong><br>${properties.origin} → ${properties.destination}`)
        .addTo(map)
    })

    map.on('mouseleave', 'routes-layer', () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
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
