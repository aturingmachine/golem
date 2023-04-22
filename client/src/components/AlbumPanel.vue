<template>
  <v-card class="album-panel text-white" :title="album.name" :subtitle="album.artist" :image="artUrl" elevation="10">
    <v-card-item>
      <v-card-text>
        {{ albumListings?.length }} Tracks
      </v-card-text>
    </v-card-item>
  </v-card>
</template>

<script lang="ts" setup>
import type { Album } from '@/models/album';
import { useListingsStore } from '@/stores/listings';
import { createArtUrl } from '@/utils/album-art';
import { computed } from 'vue';

interface Props {
  album: Album
}

const props = defineProps<Props>()

const listings = useListingsStore()

const artUrl = computed(() => {
  return createArtUrl(props.album)
})

const albumListings = computed(() => {
  return listings.forAlbum(props.album)
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

.album-panel {
  aspect-ratio: 1;
}

.album-panel .v-card__image img {
  filter: brightness(0.5) !important;
}

.v-card-text ul {
  overflow-y: scroll
}
</style>
