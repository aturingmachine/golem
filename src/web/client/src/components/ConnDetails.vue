<template>
  <v-card tile elevation="0" v-if="nowPlaying && album" class="pa-md-0">
    <v-card-title>
      {{ nowPlaying.artist }} - {{ nowPlaying.title }}
    </v-card-title>
    <v-card-subtitle>
      -{{ remainingTime }}
      <v-progress-linear
        striped
        :value="position"
        height="8"
        rounded
        class="mt-3"
      ></v-progress-linear>
    </v-card-subtitle>
    <v-card-text class="pa-0">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="5" align="center" class="d-flex justify-center">
            <img
              class="rounded-lg elevation-6"
              width="200"
              height="200"
              :src="albumArt"
            />
            <v-btn
              @click="playPause()"
              color="primary"
              fab
              class="align-self-center ml-4"
              ><v-icon x-large>{{
                isPaused ? 'mdi-play' : 'mdi-pause'
              }}</v-icon></v-btn
            >
            <v-btn
              @click="skipTrack()"
              color="primary"
              fab
              class="align-self-center ml-4"
              ><v-icon x-large>mdi-skip-next</v-icon></v-btn
            >
          </v-col>

          <v-col cols="12" md="7">
            <v-simple-table>
              <template v-slot:default>
                <tbody>
                  <tr>
                    <td>Album:</td>
                    <td class="text-right">
                      {{ isLocalTrack ? album.albumName : '-' }}
                    </td>
                  </tr>
                  <tr>
                    <td>BPM:</td>
                    <td class="text-right">{{ nowPlaying.bpm || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td>Genres:</td>
                    <td class="text-right">
                      {{
                        nowPlaying.genres && nowPlaying.genres.length
                          ? nowPlaying.genres.join(', ')
                          : 'N/A'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>Moods:</td>
                    <td class="text-right">
                      {{
                        nowPlaying.moods && nowPlaying.moods.length
                          ? nowPlaying.moods.join(', ')
                          : 'N/A'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td>Key:</td>
                    <td class="text-right">{{ nowPlaying.key || '-' }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
          <v-col rows="12" class="queue-wrapper mt-4 pa-0">
            <queue :id="id" />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script>
import { PlayerWebSocketClient } from '../services/websocket-client'
import { PlayerService } from '../services/player.service'
import Queue from './Queue.vue'

export default {
  name: 'ConnDetails',
  props: {
    id: String,
    isPlaying: Boolean,
  },

  components: {
    Queue,
  },

  data: () => ({
    ws: {},
    service: undefined,
  }),

  watch: {
    record(oldVal, newVal) {
      if (!!newVal && !!newVal.listing && typeof newVal.listing === 'string') {
        this.$store.dispatch('listings/getListing', newVal.listing)
      }
    },
  },

  computed: {
    record() {
      return this.$store.state.nowPlaying[this.id]
    },

    isLocalTrack() {
      return typeof this.record.listing === 'string'
    },

    nowPlaying() {
      return this.$store.getters['nowPlaying'](this.id)
    },

    position() {
      return !this.nowPlaying
        ? 0
        : (
            ((this.nowPlaying.duration - this.record.currentTime) /
              this.nowPlaying.duration) *
            100
          ).toFixed(2)
    },

    album() {
      return this.isLocalTrack
        ? this.$store.state.albums.records[this.nowPlaying.album]?.album
        : this.nowPlaying.album.art
    },

    albumArt() {
      return this.isLocalTrack
        ? `data:image/png;base64,${this.album?.art}`
        : this.album
    },

    remainingTime() {
      let seconds = this.record.currentTime
      const minutes = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0')
      seconds = seconds % 60

      return `${minutes}:${(Math.round(seconds * 100) / 100)
        .toFixed(0)
        .padStart(2, '0')}`
    },

    isPaused() {
      return !this.isPlaying && !!this.nowPlaying
    },
  },

  methods: {
    skipTrack() {
      this.service.skip()
    },

    playPause() {
      this.service.playPause()
    },
  },

  mounted() {
    this.ws = new PlayerWebSocketClient(this.id)

    this.ws.addStatusHandler((ev) => {
      const np = JSON.parse(ev.data)
      this.$store.commit('updateNowPlaying', { id: this.id, nowplaying: np })
    })

    this.service = new PlayerService(this.id)
  },

  destroyed() {
    this.ws.close()
  },
}
</script>

<style lang="scss" scoped>
.queue-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  @media screen and (max-width: 1264px) {
    border-radius: 0;
    border: 0;
  }
}
</style>
