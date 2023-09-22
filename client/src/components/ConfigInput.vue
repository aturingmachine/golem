<template>
  <v-row no-gutters>
    <v-col cols="12">
      <!--  -->
    </v-col>

    <v-col cols="9">
      <v-combobox :label="label" :disabled="disable" v-if="inputType === 'array'" chips v-model="v" :multiple="true" :items="props.initialValue"></v-combobox>
      
      <v-text-field :label="label" :disabled="disable" v-if="inputType === 'string'" v-model="v"></v-text-field>

      <v-text-field :label="label" :disabled="disable" v-if="inputType === 'number'" type="number" v-model="v"></v-text-field>
    </v-col>

    <v-col cols="3">
      <v-btn :disabled="shouldDisable" color="success" @click="emits('save', v)">Update</v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onMounted } from 'vue';
import { ref } from 'vue';

interface Props {
  initialValue: any
  disable: boolean
  label: string
}

const props = defineProps<Props>()

const emits = defineEmits(['save'])

const v = ref<any>(null)

const inputType = computed(() => {
  if (Array.isArray(props.initialValue)) {
    return 'array'
  }

  return typeof props.initialValue
})

const shouldDisable = computed(() => {
  return props.initialValue === v.value || props.disable
})


onMounted(() => {
  v.value = props.initialValue
})

</script>
