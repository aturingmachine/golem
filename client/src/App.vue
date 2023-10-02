<template>
  <v-app class="text-primary">
    <v-layout>
      <v-app-bar title="Golem" class="text-primary">
      </v-app-bar>

      <v-navigation-drawer class="main-nav">
        <v-list>
          <v-list-item v-for="route of routes" :key="route.path" :to="route.path">{{ route.title }}</v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main style="min-height: 300px;">
        <RouterView />
        <snack-bar />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import { useAppStore } from './stores/app';
import SnackBar from '@/components/SnackBar.vue'

const routes = [
  {
    title: 'Players',
    path: '/players'
  },
  {
    title: 'Config',
    path: '/config'
  },
  {
    title: 'Audit Logs',
    path: '/audits'
  },
  {
    title: 'Search',
    path: '/search'
  },
  {
    path: '/resource-usage',
    title: 'Resource Usage',
  },
  {
    title: 'Listings',
    path: '/listings'
  },
  {
    title: 'Cache',
    path: '/cached-streams'
  },
  {
    title: 'Editor',
    path: '/editor'
  },
]

const app = useAppStore()

onMounted(async () => {
  app.initPolling()

  try {
    await app.fetchAllData()
  } catch (error) {
    console.error(error)
  }
})
</script>

<style scoped>
header {
  position: fixed !important;
}
</style>

<style>
nav.main-nav {
  position: fixed !important;
}
</style>
