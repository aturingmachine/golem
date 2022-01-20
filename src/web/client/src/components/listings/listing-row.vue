<template>
  <v-list-item v-if="!!listing">
    <v-list-item-content class="d-flex align-center">
      <v-list-item-title class="d-flex align-center">
        <img
          class="album-art"
          height="75"
          v-if="album"
          :src="`data:image/png;base64,${this.album}`"
        />
        {{ listing.artist }} - {{ listing.title }}
      </v-list-item-title>
      <!-- <v-list-item-subtitle class="pl-16">
        {{ listing.artist }}
      </v-list-item-subtitle> -->
    </v-list-item-content>
  </v-list-item>
</template>

<script>
export default {
  name: 'ListingRow',

  props: {
    listingId: {
      type: String,
      required: true,
    },
  },

  data: () => ({}),

  computed: {
    listing() {
      return this.$store.state.listings.records[this.listingId]?.listing
    },

    album() {
      return this.$store.state.albums.records[this.listing.album]?.album
    },

    // albumArt() {
    //   return this.album.startsWith('http')
    //     ? this.listing.albumArt
    //     : `data:image/png;base64,${this.listing.albumArt}`
    // },
  },

  methods: {},

  mounted() {
    this.$store.dispatch('listings/getListing', this.listingId)
  },
}
</script>

<style lang="scss">
.album-art {
  border-radius: 15px;
  margin-right: 10px;
}
</style>
