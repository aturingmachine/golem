<template>
  <v-container>
    <v-row no-gutters v-if="!loading">
      <v-col cols="12">
        <v-text-field @keydown.enter="search()" density="compact" v-model="q" clearable label="Search" variant="solo">
          <template v-slot:append>
            <v-btn @click="search()" color="info">Search</v-btn>
          </template>
        </v-text-field>
      </v-col>

      <v-col cols="12" v-if="top">
        <h2>Top Result</h2>
        <v-card class="bg-blue-grey-darken-2">
          <v-card-title>
            {{ top?.rawResult.string }} - {{ processScore(top?.rawResult.score) }}
          </v-card-title>

          <v-card-text>
            <listing-row-wrapper :id="top.listing.listingId" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" >
        <h2>All Results:</h2>
      </v-col>

      <v-col cols="12" v-for="result in results" :key="result.original">
        <v-card class="ma-1 bg-blue-grey-darken-2">
          <v-card-title>
            {{ result.string }} - {{ processScore(result.score) }}
          </v-card-title>

          <v-card-text>
            <listing-row-wrapper :id="result.original" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="q.length && results.length === 0 && !loading">
        <h3>No Search Results</h3>
      </v-col>
    </v-row>

    <v-row no-gutters v-else>
      <v-progress-circular indeterminate>
      </v-progress-circular>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { MappedSearchResult, SearchResults, TopResult } from '@/models/search';
import { Http } from '@/utils/fetch';
import { ref } from 'vue';
import ListingRowWrapper from '@/components/ListingRowWrapper.vue';

const q = ref('')
const loading = ref(false)
const results = ref<MappedSearchResult[]>([])
const top = ref<TopResult>()

async function search() {
  loading.value = true
  console.log('Search!', q.value)
  const response = await Http.get<SearchResults>(`/listings/search?q=${q.value}`)

  const mappedResults = response.results.results.map((res) => ({...res, original: res.original.listingId}))

  results.value = mappedResults
  top.value = response.results.top

  loading.value = false
}

function processScore(score?: number | null): string {
  if (typeof score === 'number') {
    return score.toString()
  }

  if (typeof score === 'undefined') {
    return ''
  }

  return 'Infinite'
}
</script>
