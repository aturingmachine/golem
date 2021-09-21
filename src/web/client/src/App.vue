<template>
  <div id="app">
    <div v-for="conn in connections" :key="conn.id">
      {{ conn.id }}
       <conn-details :id="conn.id" />
    </div>
  </div>
</template>

<script>
import { VoiceConnectionsWebSocketClient } from './services/websocket-client'
import ConnDetails from './components/ConnDetails.vue'

export default {
  name: 'App',

  components: {
    ConnDetails,
  },

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
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
