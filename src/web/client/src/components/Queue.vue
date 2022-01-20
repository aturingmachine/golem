<template>
  <div v-if="queue && queue.length">
    <h6 class="text-h6 pl-3 pb-2">{{ queue.length }} Queued Tracks</h6>
    <v-virtual-scroll bench="1" :items="queue" height="300" item-height="100">
      <template v-slot:default="{ item }">
        <v-list-item :key="item.track_id">
          <v-list-item-content class="d-flex align-center">
            <v-list-item-title class="d-flex align-center">
              <!-- <v-btn
                class="
                  rounded-lg
                  elevation-6
                  mr-4
                  align-center
                  justify-center
                  d-flex
                  queue-play-button
                "
                icon
                :style="`background-image: url(${albumArt(
                  item
                )}); background-size: cover; width: 50px; height: 50px;`"
              > -->
              <queue-button :albumId="item.album">
                <v-icon class="queue-play" color="primary">mdi-play</v-icon>
              </queue-button>
              <!-- </v-btn> -->
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
  <div v-else>
    <h3 class="text-center pb-5">No Queued Tracks</h3>
  </div>
</template>

<script>
import { QueueWebSocketClient } from '../services/websocket-client'
import QueueButton from './QueueButton.vue'

export default {
  name: 'Queue',

  components: {
    QueueButton,
  },

  props: {
    id: String,
  },

  data: () => ({
    ws: undefined,
  }),

  computed: {
    queue() {
      return this.$store.getters['queue'](this.id)
    },
  },

  methods: {
    albumArt(item) {
      if (!item) {
        return ''
      }

      if (item.album?.name?.startsWith('http')) {
        item.album.art
      }

      const records = this.$store.state.albums.records

      return `data:image/png;base64,${records[item]?.album?.art}`
    },
  },

  mounted() {
    this.ws = new QueueWebSocketClient(this.id)

    this.ws.addUpdateHandler((ev) => {
      const data = JSON.parse(ev.data)

      this.$store.commit('updateQueues', { id: this.id, queue: data.queue })
      this.$store.dispatch('listings/getListing', data.queue)
    })
  },
}
</script>

<style lang="scss">
.queue-play-button {
  .queue-play {
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.645);
  }

  &:hover {
    .queue-play {
      box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.645);
    }
  }
}
</style>
