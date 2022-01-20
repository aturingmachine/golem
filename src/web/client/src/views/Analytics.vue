<template>
  <div>Analytics Page!</div>
</template>

<script>
export default {
  name: 'AnalyticsPage',

  data: () => ({}),

  computed: {
    records() {
      return this.$store.state.analytics
    },
  },

  methods: {
    getRecords() {
      this.$store.dispatch('getAnalytics')
    },
  },

  mounted() {
    this.getRecords()
  },
}
</script>

<style lang="scss">
</style>
