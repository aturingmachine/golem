<template>
  <div class="wrapper">
    <div v-if="nowPlaying">
      {{ nowPlaying.artist }} - {{ nowPlaying.title }}
    </div>
  </div>
</template>

<script>
import {PlayerWebSocketClient} from '../services/websocket-client'

export default {
  name: 'ConnDetails',
  props: {
    id: String
  },

  data: () => ({
    ws: {}
  }),

  computed: {
    nowPlaying() {
      return this.$store.state.nowPlaying[this.id]?.nowPlaying
    }
  },

  mounted() {
    this.ws = new PlayerWebSocketClient(this.id)

    this.ws.addStatusHandler((ev) => {
      console.log(JSON.parse(ev.data))
      const np = JSON.parse(ev.data)
      this.$store.commit('updateNowPlaying', {id: this.id, nowplaying: np })
    })
  },

  destroyed() {
    this.ws.close()
  }
}
</script>
