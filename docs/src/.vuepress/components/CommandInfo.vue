<template>
  <div>
    <h2>
      {{ info.name }}
      <template v-if="info.requiredModules" >
        <badge 
          v-for="module of info.requiredModules.all" 
          :key="module"
          :text="module"
          :type="`${module.toLowerCase()}-badge`"
        />
        <badge 
          v-for="module of info.requiredModules.oneOf" 
          :key="module"
          :text="`${module}*`"
          :type="`${module.toLowerCase()}-badge  optional-mod-badge tooltip-root`"
        />
      </template>
    </h2>

    <p>
      {{ info.description.long || info.description.short }}
    </p>

    <examples v-if="isLongForm" :examples="info.examples" />
    
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
