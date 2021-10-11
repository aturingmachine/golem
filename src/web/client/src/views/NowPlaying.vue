<template>
  <v-expansion-panels v-if="connections && connections.length" accordian class="pa-md-0">
    <connection v-for="conn of connections" :key="conn.id" :connection="conn"/>
  </v-expansion-panels>
</template>

<script>
import Connection from '../components/Connection.vue';
// import { VoiceConnectionsWebSocketClient } from './services/websocket-client'

export default {
  name: 'NowPlaying',

  components: {
    Connection,
  },

  computed: {
    connections() {
      return this.$store.state.connections
    }
  },

  // mounted() {
  //   const vcws = new VoiceConnectionsWebSocketClient()
  //   vcws.addLogStreamHandler((ev) => {
  //     const connectionData = JSON.parse(ev.data)

  //     this.$store.commit('setConnections', {connections: connectionData.connections})
  //   })
  // }
};
</script>

<style>

</style>
