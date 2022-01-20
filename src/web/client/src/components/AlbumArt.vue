<template>
  <img v-if="art" :src="art" />
</template>

<script>
export default {
  name: 'AlbumArt',

  props: {
    id: {
      type: String,
      required: true,
    },

    isLocal: {
      type: Boolean,
    },
  },

  computed: {
    art() {
      if (this.isLocal) {
        return `data:image/png;base64,${
          this.$store.state.albums.records[this.id]?.album
        }`
      }

      return this.id
    },
  },
}
</script>

<style>
</style>
