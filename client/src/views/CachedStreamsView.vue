<template>
  <v-container>
    <v-row v-for="record of records" :key="record._id">
      <v-col cols="12">
        <div class="bg-blue-grey-darken-2 rounded d-flex flex-row w-100 pa-2">
          <v-img class="art-image mr-5 rounded-lg" :src="record.thumbnail" max-width="25%">
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular
                  color="grey-lighten-4"
                  indeterminate
                ></v-progress-circular>
              </div>
            </template>
          </v-img>

          <div class="d-flex flex-column">
            <h3>
              {{ record.title }} - {{ record.artist }}
            </h3>

            <span>Initial Cache:<br />{{ dateTime(record.initial_cache_date) }}</span>
            <span>Last Accessed:<br />{{ dateTime(record.last_access_date) }}</span>

            <v-btn :disabled="cachedStreams.isLoading" color="error" @click="cachedStreams.delete(record.external_id, 'YouTube')">Delete</v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useCachedStreamsStore } from '@/stores/cached-streams';
import { computed, onMounted } from 'vue';
import {dateTime} from '@/utils/time'

const cachedStreams = useCachedStreamsStore()

const records = computed(() => {
  return cachedStreams.YouTube.records
})

onMounted(async () => {
  await cachedStreams.fetch()
})
</script>
