<template>
  <v-btn
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
    :style="`background-image: url(${art}); background-size: cover; width: 50px; height: 50px;`"
  >
    <slot></slot>
  </v-btn>
</template>

<script>
export default {
  name: 'QueueButton',

  props: {
    albumId: {
      type: String,
    },
  },

  computed: {
    isLocal() {
      return !this.albumId?.startsWith('http')
    },

    art() {
      return this.$store.getters['albums/art'](this.albumId)
    },
  },
}
</script>

<style>
</style>
