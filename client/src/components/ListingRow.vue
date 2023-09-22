<template>
  <v-list-item
    class="overflow-auto listing-row"
    v-if="listing"
  >

  <!-- <template v-slot:title>
    {{ listing.title }}
  </template>

  <template v-slot:subtitle>
    {{ listing.artist + ' - ' + albumName }}
  </template> -->
  <!-- :prepend-avatar="art" -->

  <!-- <template v-slot:prepend>
    <div>
      <v-img class="art-image" :src="art">
      </v-img>
    </div>
  </template> -->

  <div class="d-flex flex-column w-100">
    <div class="d-flex flex-row w-100">
      <v-img class="art-image mr-5 rounded-lg" :src="art" max-width="25%">
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular
              color="grey-lighten-4"
              indeterminate
            ></v-progress-circular>
          </div>
        </template>
      </v-img>

      <div>
        <h2>{{ listing.title }}</h2>
        <h3>{{ listing.artist + ' - ' + albumName }}</h3>
        <div class="d-flex flex-row">
          <dl v-for="(page, index) of dataPoints" :key="index">
            <template v-for="point of page" :key="point.key">
              <dt>{{ point.key }}</dt>
              <dd> {{ point.value }}</dd>
            </template>
          </dl>
        </div>
      </div>
    </div>

    <div class="mt-4" v-if="'key' in listing">
      <span class="font-weight-black">Track Path:</span> {{ listing.path }} <br>
      <span class="font-weight-black">Local Listing ID:</span> {{ listing.listingId }}
    </div>
  </div>

  </v-list-item>
</template>

<script lang="ts" setup>
import type { LocalListing } from '@/models/listings';
import { TrackType, type ShortTrack } from '@/models/players';
import { useAlbumsStore } from '@/stores/albums';
import { createArt } from '@/utils/album-art';
import { chonk } from '@/utils/arrays';
import { formatMS } from '@/utils/time';
import { computed } from 'vue';

interface Props {
  listing: LocalListing | ShortTrack
}

const props = defineProps<Props>()

const albumName = computed(() => {
  return  'albumName' in props.listing ? props.listing.albumName : props.listing.album
})

const album = computed(() => {
  if (props.listing.albumId) {
    const albums = useAlbumsStore()

    return albums.records[props.listing.albumId]
  }

  return undefined
})

const art = computed(() => {
  const albumRoot = album.value?.fileRoot

  return createArt('type' in props.listing ? props.listing.type as TrackType : TrackType.Local, albumRoot || props.listing as ShortTrack)
})

const isLocalListing = computed(() => {
  return 'key' in props.listing
})

const dataPoints = computed(() => {
  const points = [
    {
      key: 'Duration',
      value: formatMS(parseFloat(props.listing.duration.toString()) * 1000)
    },
  ]

  if ('key' in props.listing) {
    points.push({key: 'Key', value: props.listing.key})
    points.push({key: 'Genres', value: props.listing.genres?.join(', ') || 'N/A'})
    points.push({key: 'MusicBrainz Artist', value: props.listing.mb.artistId})
    points.push({key: 'MusicBrainz Track', value: props.listing.mb.trackId})
  }

  return chonk(points, 3)
})
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

.v-list-item__content {
  display: flex;
  flex-direction: row;
}

.listing-row {
  display: flex;
  flex-direction: row;
}

.listing-row dl {
  display: flex;
  flex-direction: column;
  width: 80%;
}

.listing-row dt {
  font-weight: bold;
}

.listing-row dd {
  margin-left: 8px;
}

.v-list-item__prepend div {
  height: 100%;
  width: 100%;
}

/* .art-image {
} */
</style>
