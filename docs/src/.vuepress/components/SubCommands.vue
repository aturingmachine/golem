<template>
  <section>
    <h3> Subcommands </h3>
    <ul>
      <li class="subcommand" v-for="subcommand of subcommands" :key="subcommand.name">
        <strong>{{ subcommand.name }}</strong>: {{ getDescription(subcommand) }}

        <arguments-list class="subcommand-arguments" v-if="subcommand.args.length" :is-long-form="isLongForm" :args="subcommand.args" />
      </li>
    </ul>
  </section>
</template>

<script>
import commands from '../data/commands.json'
import ArgumentsList from './ArgumentsList.vue'

export default {
  name: 'Subcommands',

  components: {
    ArgumentsList
  },

  props: {
    subcommands: {
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
    getDescription(subcommand) {
      return this.isLongForm ? subcommand.description.long || subcommand.description.short : subcommand.description.short
    }
  },
}
</script>
