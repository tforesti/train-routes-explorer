import { createWebHistory, createRouter } from 'vue-router'

import MapView from './components/MapView.vue'
import AboutView from './components/AboutView.vue'

const routes = [
  { path: '/', component: MapView },
  { path: '/about', component: AboutView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})