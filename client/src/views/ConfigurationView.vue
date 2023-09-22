<template>
  <v-container v-if="config.record">
    <v-row no-gutters>
      <v-col class="mt-3 mb-3" cols="12">
        <h2> Configuration </h2>
        {{ config.canUpdate }}
        {{ config.status }}
      </v-col>

      <!-- Log Levels -->
      <v-col class="mt-3 mb-3" cols="12">
        <v-card title="Log Levels">
          <v-card-text>
            <config-input label="Log Levels" :disable="!config.canUpdate" :initial-value="config.record.logLevels" @save="update('logLevels', $event)" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Search Config -->
      <v-col class="mt-3 mb-3" cols="12">
        <v-card title="Search">
          <v-card-text>
            <config-input label="Search Force Weight Terms" :disable="!config.canUpdate" :initial-value="config.record.search?.forceWeightTerms" @save="update('search.forceWeightTerms', $event)" />

            <config-input label="Minimum Score" :disable="!config.canUpdate" :initial-value="config.record.search?.minimumScore" @save="update('search.minimumScore', $event)" />
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>
  </v-container>

  <v-container v-else>
    <v-progress-circular indeterminate />
  </v-container>
</template>

<script setup lang="ts">
import { useConfigStore } from '@/stores/configuration';
import { computed, ref } from 'vue';
import ConfigInput from '@/components/ConfigInput.vue';

const config = useConfigStore()

async function update(path: string, value: any) {
  console.log(path, value)
  await config.update(path, value)
}

</script>

