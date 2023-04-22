<template>
  <v-snackbar
    :model-value="!!snackbarData"
    @update:model-value="remove()"
    :timeout="snackbarData?.timeout || 10000"
    :color="snackbarData?.type"
    position="static"
  >
    {{ snackbarData?.text }}

    <template v-slot:actions>
      <v-btn
        v-if="snackbarData?.button"
        color="pink"
        variant="text"
        @click="handleClick()"
      >
        {{ snackbarData?.button.text }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { computed } from 'vue';

const app = useAppStore()

const snackbarData = computed(() => app.snackbar.data)

async function handleClick(): Promise<void> {
  if (snackbarData.value?.button) {
    if (snackbarData.value.button.onClick) {
      await snackbarData.value.button.onClick()
    }

    remove()
  }
}

function remove(): void {
  app.removeSnackbar()
}
</script>
