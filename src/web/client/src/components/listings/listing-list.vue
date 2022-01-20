<template>
  <v-virtual-scroll bench="1" :items="listings" height="1000" item-height="100">
    <template v-slot:default="{ item }">
      <listing-row :listingId="item" :key="item" />
      <!-- <v-list-item :key="item.track_id">
        <v-list-item-content class="d-flex align-center">
          <v-list-item-title class="d-flex align-center">
            <img :src="albumArt(item)" />
            {{ item.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="pl-16">
            {{ item.artist }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item> -->

      <v-divider></v-divider>
    </template>
  </v-virtual-scroll>
</template>

<script>
import ListingRow from './listing-row.vue'

export default {
  name: 'ListingList',

  components: {
    ListingRow,
  },

  data: () => ({}),

  computed: {
    listings() {
      return this.$store.state.listings.ids
    },
  },

  methods: {
    albumArt(item) {
      return item.albumArt.startsWith('http')
        ? item.albumArt
        : `data:image/png;base64,${item.albumArt}`
    },
  },
}
</script>

<style>
</style>
