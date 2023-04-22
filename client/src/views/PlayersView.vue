<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12">
        <h2> Active Golem Players </h2>
      </v-col>

      <v-col v-for="player of players.list" :key="player.guild.id" cols="6">
        <player-card :player="player" />
      </v-col>

      <h3 v-if="players.list.length === 0">No Active Players</h3>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { usePlayersStore } from '@/stores/players';
import PlayerCard from '@/components/PlayerCard.vue';

const players = usePlayersStore()
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
