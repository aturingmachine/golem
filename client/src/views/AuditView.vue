<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12">
        <v-select
          v-model="selectedGuild"
          label="Select A Guild"
          :items="guilds.list"
          item-title="name"
          item-value="id"
          variant="solo"
        ></v-select>
      </v-col>

      <audit-row v-for="log of logs" :key="log._id" :audit="log">
      </audit-row>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useAuditsStore } from '@/stores/audits';
import { useGuildsStore } from '@/stores/guilds';
import { computed, ref } from 'vue';
import AuditRow from '@/components/AuditRow.vue';


const guilds = useGuildsStore()
const audits = useAuditsStore()

const selectedGuild = ref<string | undefined>()

const logs = computed(() => {
  if (!selectedGuild.value) {
    return []
  }

  return audits.forGuild(selectedGuild.value)
})
</script>

