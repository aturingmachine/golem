<template>
  <div v-if="!hasLoaded">Loading connections...</div>
  <v-expansion-panels
    v-else-if="connections && connections.length"
    accordian
    class="pa-md-0"
  >
    <connection v-for="conn of connections" :key="conn.id" :connection="conn" />
  </v-expansion-panels>
  <div v-else></div>
</template>

<script>
import Connection from '../components/Connection.vue'

export default {
  name: 'NowPlaying',

  components: {
    Connection,
  },

  computed: {
    hasLoaded() {
      return this.$store.state.connections.status === 'loaded'
    },

    connections() {
      return this.$store.state.connections.records
    },
  },
}
</script>

<style>
</style>
