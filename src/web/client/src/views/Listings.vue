<template>
  <div v-if="!hasLoaded">Loading...</div>
  <listing-list v-else />
</template>

<script>
import ListingList from '../components/listings/listing-list.vue'

export default {
  name: 'ListingsPage',

  components: {
    ListingList,
  },

  data: () => ({}),

  computed: {
    hasLoaded() {
      return this.$store.state.listings.status === 'loaded'
    },
  },

  methods: {},

  mounted() {},
}
</script>

<style lang="scss">
</style>
