<template>
  <v-expansion-panel>
    <v-expansion-panel-header class="text-h5">
      {{ connection.name }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <conn-details :id="connection.id" :isPlaying="connection.isPlaying" />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import ConnDetails from './ConnDetails.vue'

export default {
  name: 'Connection',

  components: {
    ConnDetails,
  },

  props: {
    connection: Object,
  },

  data: () => ({
    isOpen: false,
  }),
}
</script>

<style lang="scss">
.v-expansion-panel-content__wrap {
  @media screen and (max-width: 1264px) {
    padding: 0 !important;
  }
}
</style>
