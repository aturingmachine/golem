<template>
  <div>
    <h2>
      {{ info.name }}
      <badge 
        v-for="module of info.requiredModules" 
        :key="module"
        :text="module"
        :type="`${module.toLowerCase()}-badge`"
      />
    </h2>

    <p>
      {{ info.description.long || info.description.short }}
    </p>

    <examples v-if="isLongForm" :examples="info.examples" />

    <!-- <h3> Legacy Command </h3>
    <pre v-if="isLongForm" class="dc-chat-box">{{ info.examples.legacy.join('\n') }}</pre>

    <h3> Slash Command </h3>
    <pre v-if="isLongForm" class="dc-chat-box">{{ info.examples.slashCommand.join('\n') }}</pre> -->

    <subcommands v-if="info.subcommands" :is-long-form="isLongForm" :subcommands="info.subcommands" />

    <arguments-list 
      v-if="info.args.length" 
      :args="info.args" 
      :is-long-form="isLongForm" 
    />
  </div>
</template>

<script>
import commands from '../data/commands.json'
import ArgumentsList from './ArgumentsList.vue'
import Examples from './Examples.vue'
import Subcommands from './SubCommands.vue'

export default {
  name: 'CommandInfo',

  components: {
    ArgumentsList,
    Examples,
    Subcommands,
  },

  props: {
    commandData: {
      type: Object,
      required: false
    },
    commandName: {
      type: String,
      required: false
    },
    isLongForm: {
      type: Boolean,
      default: false,
      required: false,
    }
  },

  computed: {
    command() {
      return this.commandData || commands.find(cmd => cmd.options.info.name === this.commandName)
    },

    info() {
      return this.command.options.info
    }
  }
}
</script>
