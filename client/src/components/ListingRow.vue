<template>
  <v-list-item
    class="overflow-auto listing-row"
    v-if="listing"
    :title="listing.title"
    :subtitle="listing.artist + ' - ' + albumName"
    :prepend-avatar="art"
  >
  <dl>
    <template v-for="point of dataPoints" :key="point.key">
      <dt>{{ point.key }}</dt>
      <dd> {{ point.value }}</dd>
    </template>
  </dl>
  </v-list-item>
</template>

<script lang="ts" setup>
import type { LocalListing } from '@/models/listings';
import { TrackType, type ShortTrack } from '@/models/players';
import { useAlbumsStore } from '@/stores/albums';
import { createArt } from '@/utils/album-art';
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

const dataPoints = computed(() => {
  const points = [
    {
      key: 'Duration',
      value: formatMS(parseFloat(props.listing.duration.toString()) * 1000)
    },
  ]

  if ('key' in props.listing) {
    //
    points.push({key: 'Key', value: props.listing.key})
  }

  return points
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

.listing-row dt {
  font-weight: bold;
}

.listing-row dd {
  margin-left: 8px;
}
</style>
