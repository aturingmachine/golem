<template>
  <listing-row :listing="listing" />
</template>

<script setup lang="ts">
import { useListingsStore } from '@/stores/listings';
import { computed } from 'vue';
import ListingRow from './ListingRow.vue';

interface Props {
  id: string
}

const props = defineProps<Props>()

const listings = useListingsStore()

const listing = computed(() => {
  return listings.records[props.id]
})
</script>
