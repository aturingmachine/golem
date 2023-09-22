<template>
  <div>
    Err: {{ error }}
  </div>
</template>

<script setup lang="ts">
import type { EditorCompileError } from '../../models/client-ast';

interface Props {
  error: EditorCompileError
}

const props = defineProps<Props>()
</script>
