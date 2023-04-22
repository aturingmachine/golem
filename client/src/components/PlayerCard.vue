<template>
  <v-card class="elevation-5 bg-blue-grey-darken-3" :title="title" :subtitle="subtitle">
    <v-card-item v-if="(listing || player.nowPlaying.listing) && player.status !== 'idle'">
      <v-card-text class="d-flex">
        <album-art ref="art" :listing="player.nowPlaying.listing" :file-root="listing?.album.fileRoot" :type="player.nowPlaying.listing.type" />
        <div>
          <dl>
            <dt>Track</dt>
            <dd>{{ player.nowPlaying.listing.title }}</dd>

            <dt>Artist</dt>
            <dd>{{ player.nowPlaying.listing.artist }}</dd>

            <dt>Album</dt>
            <dd>{{ listing?.albumName || '-' }}</dd>
          </dl>

          <!-- <h4>{{ player.nowPlaying.listing.title }} by {{ player.nowPlaying.listing.artist }}</h4>
          {{ listing?.albumName || '-' }} -->
        </div>
      </v-card-text>

      <v-card-actions class="d-flex flex-row justify-space-between">
        <div class="d-flex flex-column progress-wrapper">
          {{ current }} / {{ length }}

          <div class="progress-container bg-blue-grey-lighten-5">
            <div  :style="progressBar"></div>
          </div>
        </div>

        <v-btn class="bg-error text-white" @click="stopPlayer()">
          Stop
        </v-btn>
      </v-card-actions>

      <div v-if="player.queue.length">
        <h4>Up Next ({{ player.queue.length }})</h4>
        <listing-row v-for="t of player.queue.slice(0, 5)" :listing="t" :key="t.id" />
        <!-- <v-expansion-panel>
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row no-gutters>
                <v-col cols="4" class="d-flex justify-start">
                  Trip name
                </v-col>
                <v-col
                  cols="8"
                  class="text-grey"
                >
                  <v-fade-transition leave-absolute>
                    <span
                      v-if="expanded"
                      key="0"
                    >
                      Enter a name for the trip 
                    </span>
                  </v-fade-transition>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list lines="one">
              <v-list-item
                title="item.title"
                subtitle="..."
              ></v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel> -->
      </div>
    </v-card-item>
  </v-card>
</template>

<script lang="ts" setup>
import { TrackType, type MusicPlayerJSON } from '@/models/players';
import { useListingsStore } from '@/stores/listings';
import { Http } from '@/utils/fetch';
import { showSnackbar } from '@/utils/snack-bar';
import { convertMS } from '@/utils/time';
import { computed, ref } from 'vue';
import AlbumArt from './AlbumArt.vue';
import ListingRow from './ListingRow.vue';

interface Props {
  player: MusicPlayerJSON
}

const props = defineProps<Props>()

const listings = useListingsStore()

const art = ref<HTMLElement | null>(null)
const showQueue = ref(false)

const title = computed(
  () => `${props.player.guild.name}`
)

const subtitle = computed(() => {
  return `${props.player.channel.name} - ${props.player.status}`
})

const listing = computed(() => {
  return props.player.nowPlaying.listing.id && props.player.nowPlaying.listing.type === TrackType.Local
    ? listings.records[props.player.nowPlaying.listing.id] 
    : undefined
})

const progressBar = computed(() => {
  if (
    !props.player.nowPlaying.listing.playbackDuration 
    || !props.player.nowPlaying.listing.duration
  ) {
    return {
      width: '0%'
    }
  }

  const duration = props.player.nowPlaying.listing.duration * 1000;
  const percent = props.player.nowPlaying.listing.playbackDuration  / duration

  const color = /*(art.value as any)?.color ||*/ [245, 0, 87]

  return {
    width: `${percent * 100}%`,
    backgroundColor: `rgba(${color.join(', ')})`
  }
})

const length = computed(() => {
  if (!props.player.nowPlaying.listing.duration) {
    return undefined
  }

  const parsed = convertMS(props.player.nowPlaying.listing.duration * 1000)

  let base = `${parsed.minute.toString().padStart(2, '0')}:${parsed.seconds.toString().padStart(2, '0')}`

  if (parsed.hour) {
    base = `${parsed.hour.toString().padStart(2, '0')}:${base}`
  }

  return base
})

const current = computed(() => {
  if (!props.player.nowPlaying.listing.playbackDuration) {
    return undefined
  }

  const parsed = convertMS(props.player.nowPlaying.listing.playbackDuration)

  let base = `${parsed.minute.toString().padStart(2, '0')}:${parsed.seconds.toString().padStart(2, '0')}`

  if (parsed.hour) {
    base = `${parsed.hour.toString().padStart(2, '0')}:${base}`
  }

  return base
})

async function stopPlayer(): Promise<void> {
  try {
    await Http.delete(`/players/${props.player.guild.id}`)

    showSnackbar({
      text: `Player for ${props.player.guild.name} stopped.`,
      type: 'success',
      button: {
        text: 'OK!'
      }
    })
  } catch (error) {
    console.error(error)

    showSnackbar({
      text: `Couldn't stop player for ${props.player.guild.name}`,
      type: 'error',
      button: {
        text: 'OK!'
      }
    })
  }
}
</script>

<style>
.v-card-text {
  gap: 10px;
}

.v-card-text .v-responsive.v-img {
  width: 50%;
}

.v-card-subtitle {
  text-transform: capitalize !important;
}

.progress-wrapper {
  width: 80%;
}

.progress-container {
  width: 100%;
  height: 15px;
  border-radius: 10px;
}

.progress-container div {
  height: 15px;
  transition: all 3s linear;
  border-radius: 10px;
}
</style>
