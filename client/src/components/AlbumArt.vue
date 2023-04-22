<template>
  <!-- <div :data-album-art-id="album?._id"> -->
    <v-img ref="art" :data-album-art-id="artSrc" :src="artSrc" cross-origin></v-img>
  <!-- </div> -->
  <!-- "https://i.ytimg.com/vi/N_2xEKsvkLo/maxresdefault.jpg -->
</template>

<script lang="ts" setup>
import type { Album } from '@/models/album';
import type { LocalListing } from '@/models/listings';
import type { TrackType, MusicPlayerJSON, ShortTrack } from '@/models/players';
import { createArt, createArtUrl } from '@/utils/album-art';
import { computed, ref } from 'vue';

interface Props {
  album?: Album
  fileRoot?: string
  type: TrackType
  listing: ShortTrack
  size?: 'large' | 'med' | 'small' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'med'
})

const art = ref<HTMLImageElement | null>(null)

const artSrc = computed(() => {
  return createArt(props.type, props.album || props.fileRoot || props.listing)
  // if (props.type === TrackType.Local) {
  //   return createArtUrl(props.album || props.fileRoot || '')
  // } else {
  //   return `https://i.ytimg.com/vi/${props.listing.id}/maxresdefault.jpg`
  // }
})

// const color = ref<any>()

// function setColor(): void {
//   console.log('SetColor Triggered!')
//   console.log(art.value)

//   const findColor = () => {
//     const canvas = document.createElement('canvas')
//     const context = canvas.getContext('2d');
//     const image = document.querySelector(`[data-album-art-id="${artSrc.value}"] img`) as HTMLImageElement

//     // const img = new Image;
//     // img.setAttribute('crossOrigin', ''); 
//     // img.src = artSrc.value;
//     image.crossOrigin = 'Anonymous'
    
//     if (!context || !image) {
//       console.log(!context, !image)
//       return
//     }

//     context.imageSmoothingEnabled = true;
//     context.drawImage(image, 0, 0, 1, 1);

//     return context.getImageData(0, 0, 1, 1).data.slice(0,3);
//   }

//   const foundColor = findColor()

//   console.log(foundColor)

//   color.value = foundColor
// }

// defineExpose({ color })
</script>

<style>
.v-card-subtitle {
  text-transform: capitalize !important;
}
</style>
