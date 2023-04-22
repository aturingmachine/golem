<template>
  <v-list-item
    class="overflow-auto"
    :title="listing.title"
    :subtitle="listing.artist"
    :prepend-avatar="art"
  >
    <!-- <template v-slot:append>
    </template> -->
  </v-list-item>
</template>

<script lang="ts" setup>
import type { LocalListing } from '@/models/listings';
import { TrackType, type ShortTrack } from '@/models/players';
import { useAlbumsStore } from '@/stores/albums';
import { createArt } from '@/utils/album-art';
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
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
