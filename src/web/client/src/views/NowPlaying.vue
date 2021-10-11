<template>
  <v-expansion-panels
    v-if="connections && connections.length"
    accordian
    class="pa-md-0"
  >
    <connection v-for="conn of connections" :key="conn.id" :connection="conn" />
  </v-expansion-panels>
</template>

<script>
import Connection from '../components/Connection.vue'

export default {
  name: 'NowPlaying',

  components: {
    Connection,
  },

  computed: {
    connections() {
      return this.$store.state.connections
    },
  },
}
</script>

<style>
</style>
