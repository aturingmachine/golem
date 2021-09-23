<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      clipped-left
    >
      <div class="d-flex align-center">
        <v-btn color="red" dark @click="drawer = !drawer" icon x-large>
          <v-icon class="text-h2">א</v-icon>
        </v-btn>
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer app clipped v-model="drawer"></v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-lg-10 pa-0">
        <v-expansion-panels v-if="connections && connections.length" accordian class="pa-md-0">
          <connection v-for="conn of connections" :key="conn.id" :connection="conn"/>
      </v-expansion-panels>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Connection from './components/Connection.vue';
import { VoiceConnectionsWebSocketClient } from './services/websocket-client'

export default {
  name: 'App',

  components: {
    Connection,
  },

  data: () => ({
    drawer: false
  }),

  computed: {
    connections() {
      return this.$store.state.connections
    }
  },

  mounted() {
    const vcws = new VoiceConnectionsWebSocketClient()
    vcws.addLogStreamHandler((ev) => {
      const connectionData = JSON.parse(ev.data)

      this.$store.commit('setConnections', {connections: connectionData.connections})
    })
  }
};
</script>
