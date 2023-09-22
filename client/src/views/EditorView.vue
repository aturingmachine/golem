<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="2" sm="12">
        <v-btn color="info" @click="submit">Submit</v-btn>
      </v-col>

      <v-col cols="12">
        <v-textarea 
          clearable 
          label="Golem Script" 
          variant="outlined" 
          v-model="script">
        </v-textarea>
      </v-col>

      <v-col cols="12">
        {{ editor.latest }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
import { ref } from 'vue';

const editor = useEditorStore()

const script = ref('')

async function submit() {
  await editor.parse(script.value)
}
</script>
