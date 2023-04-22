import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ListingsView from '../views/ListingsView.vue'
import PlayersView from '../views/PlayersView.vue'
import AuditView from '../views/AuditView.vue'
import ResourceView from '../views/ResourceView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: ResourceView,
  },
  {
    path: '/audits',
    name: 'audits',
    component: AuditView,
  },
  {
    path: '/resource-usage',
    name: 'resource-usage',
    component: ResourceView,
  },
  {
    path: '/listings',
    name: 'listings',
    component: ListingsView,
  },
  {
    path: '/players',
    name: 'players',
    component: PlayersView,
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
