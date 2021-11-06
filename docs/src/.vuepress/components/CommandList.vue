<template>
  <div>
    <command-info v-for="command in commands" :key="command.options.logSource" :command-data="command" />
  </div>
</template>

<script>
import commands from '../data/commands.json'
import CommandInfo from './CommandInfo.vue'

export default {
  name: 'CommandList',

  components: {
    CommandInfo,
  },

  computed: {
    commands() {
      return commands
    }
  }
}
</script>
