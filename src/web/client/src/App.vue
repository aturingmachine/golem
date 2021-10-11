<template>
  <v-app>
    <v-app-bar app color="primary" clipped-left>
      <div class="d-flex align-center">
        <v-btn color="white" dark @click="drawer = !drawer" icon x-large>
          <v-icon class="text-h2">א</v-icon>
        </v-btn>
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer app clipped v-model="drawer">
      <v-list nav>
        <v-list-item v-for="link in links" :key="link.name" :to="link.route">
          {{ link.title }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-lg-10 pa-0">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>



<script>
import { VoiceConnectionsWebSocketClient } from './services/websocket-client'

export default {
  name: 'App',

  data: () => ({
    drawer: false,
    links: [
      {
        name: 'Home',
        route: '/',
        title: 'Home',
      },
      {
        name: 'logs',
        route: '/logs',
        title: 'Logs',
      },
    ],
  }),

  computed: {
    connections() {
      return this.$store.state.connections
    },
  },

  mounted() {
    const vcws = new VoiceConnectionsWebSocketClient()
    vcws.addLogStreamHandler((ev) => {
      const connectionData = JSON.parse(ev.data)

      this.$store.commit('setConnections', {
        connections: connectionData.connections,
      })
    })
  },
}
</script>
