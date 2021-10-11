import Vue from 'vue'
import VueRouter from 'vue-router'
import NowPlaying from '../views/NowPlaying.vue'
import Logs from '../views/Logs.vue'

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
]

const router = new VueRouter({
  routes
})

export default router
