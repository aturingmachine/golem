<template>
  <div>
    <v-pagination v-model="page" :length="length"></v-pagination>

    <div class="paginated-list">
      <!--  -->
      <template v-for="item in items" :key="item.id">
        <slot :item="item"></slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props<T = any> {
  items: T[]
  modelValue?: number
  pageLength?: number
}

const props = withDefaults(defineProps<Props<any>>(), {
  pageLength: 10,
  currentPage: 1,
})

const emit = defineEmits(['modelValue:update'])

const length = computed(() => {
  return Math.floor(props.items.length / props.pageLength)
})

const page = computed({
  get() {
    return props.modelValue
  },

  set(newVal: number) {
    emit('modelValue:update', newVal)
  }
})

const itemsToShow = computed(() => {
  let page_index = page.value * props.pageLength

  return props.items.slice(page_index, page_index + props.pageLength)
})
</script>
