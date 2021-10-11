<template>
  <div v-if="queue && queue.length">
    <h6 class="text-h6 pl-3 pb-2">{{ queue.length }} Queued Tracks</h6>
    <v-virtual-scroll bench="1" :items="queue" height="300" item-height="100">
      <template v-slot:default="{ item }">
        <v-list-item :key="item.track_id">
          <v-list-item-content class="d-flex align-center">
            <v-list-item-title class="d-flex align-center">
              <v-btn
                class="
                  rounded-lg
                  elevation-6
                  mr-4
                  align-center
                  justify-center
                  d-flex
                "
                icon
                :style="`background-image: url(data:image/png;base64,${item.albumArt}); background-size: cover; width: 50px; height: 50px;`"
              >
                <v-icon color="primary">mdi-play</v-icon>
              </v-btn>
              {{ item.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="pl-16">
              {{ item.artist }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>
      </template>
    </v-virtual-scroll>
  </div>
  <div v-else>No Queued Tracks</div>
</template>

<script>
import { QueueWebSocketClient } from '../services/websocket-client'
export default {
  name: 'Queue',

  props: {
    id: String,
  },

  data: () => ({
    ws: undefined,
  }),

  computed: {
    queue() {
      return this.$store.state.queues[this.id]
    },
  },

  mounted() {
    this.ws = new QueueWebSocketClient(this.id)

    this.ws.addUpdateHandler((ev) => {
      const data = JSON.parse(ev.data)

      this.$store.commit('updateQueues', { id: this.id, queue: data.queue })
    })
  },
}
</script>

<style>
</style>
