<template>
  <div>
    <h3> Legacy Command </h3>
    <pre class="dc-chat-box">{{ examples.legacy.join('\n') }}</pre>

    <h3> Slash Command </h3>
    <pre class="dc-chat-box">{{ examples.slashCommand.join('\n') }}</pre>
  </div>
</template>

<script>
import ArgumentsList from './ArgumentsList.vue'

export default {
  name: 'Examples',

  components: {
    ArgumentsList
  },

  props: {
    examples: {
      type: Object,
      required: false
    },
  },
}
</script>
