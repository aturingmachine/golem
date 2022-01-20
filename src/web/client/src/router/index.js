import Vue from 'vue'
import VueRouter from 'vue-router'
import NowPlaying from '../views/NowPlaying.vue'
import Logs from '../views/Logs.vue'
import Analytics from '../views/Analytics.vue'
import Listings from '../views/Listings.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Connections',
    component: NowPlaying
  },
  {
    path: '/logs',
    name: 'Logs',
    component: Logs
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics
  },
  {
    path: '/listings',
    name: 'Listings',
    component: Listings
  },
]

const router = new VueRouter({
  routes
})

export default router
