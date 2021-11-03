<template>
  <section class="indent-1">
    <h3> Arguments </h3>
    <ul>
      <li v-for="arg of args" :key="arg.name + arg.type">
        <strong>{{ arg.name }}</strong><i v-if="arg.required">*</i> - <code>{{ arg.type }}</code>: {{ getDescription(arg) }}
      </li>
    </ul>
  </section>
</template>

<script>
import commands from '../data/commands.json'

export default {
  name: 'ArgumentsList',

  props: {
    args: {
      type: Array,
      required: true,
    },
    isLongForm: {
      type: Boolean,
      default: false,
      required: false,
    }
  },

  methods: {
    getDescription(arg) {
      return this.isLongForm ? arg.description.long || arg.description.short : arg.description.short
    }
  },
}
</script>
