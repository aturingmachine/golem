<template>
  <div>
    <div class="filter-container">
      <v-container>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="3"
          >
            <v-select
              v-model="selectedSources"
              @change="updateFilter()"
              :items="sources"
              label="Sources"
              multiple
              chips
            ></v-select>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            md="3"
          >
            <v-select
              v-model="selectedLevels"
              @change="updateFilter()"
              :items="logLevels"
              label="Log Levels"
              multiple
              chips
            ></v-select>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            md="3"
          >
            <v-form>
              <v-text-field
                v-model="filterString"
                label="Filter Logs"
                @input="updateFilter()"
              ></v-text-field>
            </v-form>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div class="log-container">
      <pre id="log-console">
        <div v-for="log in logs" :key="log.id"><i :class="`log-level ${log._client_level_class}`">{{ log.level }}</i> [<i :class="`log-src ${log._client_src_class}`">{{ log.src.trim() }}</i>] {{ log.message }}</div>
      </pre>
    </div>
  </div>
</template>

<script>
import { LogWebSocketClient } from '../services/websocket-client';
import { logInfoClassMappings } from '../utils/log-prettifier'

export default {
  name: 'LogsPage',

  data: () => ({
    logsService: {},
    logLevels: ['info', 'debug', 'warn', 'error'],
    selectedSources: [],
    selectedLevels: [],
    filterString: '',
  }),

  computed: {
    logs() {
      return this.$store.getters['logs/filteredLogs']
    },

    sources() {
      return Object.keys(logInfoClassMappings).sort()
    }
  },

  methods: {
    updateFilter() {
      this.$store.commit('logs/filter', {
        levels: this.selectedLevels,
        sources: this.selectedSources,
        filterString: this.filterString
      })
    }
  },

  mounted() {
    this.logsService = new LogWebSocketClient()

    this.logsService.addUpdateHandler((ev) => {
      try {
        this.$store.commit('logs/addLog', {logs: [JSON.parse(ev.data)]})

        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth'
        })
      } catch (error) {
        //
      }
    })
  },

  destroyed() {
    this.logsService.disconnect()
  }
};
</script>

<style lang="scss">
.log-container {
  padding-bottom: 48px;
}

#log-console {
  padding-left: 0;
  display: flex;
  flex-direction: column;
}

#log-console div {
  white-space: pre-line;
  word-break: break-word;
  margin-bottom: 0;
  padding: 3px 10px 3px 6px;
}

#log-console div:nth-child(even) {
  /* color: red; */
  background-color: rgba(255, 255, 255, 0.075);
}

#log-console i {
  font-style: normal;
  background-color: transparent !important;

  &.blue {
    color: rgb(70, 86, 252);
  }

  &.blue-bright {
    color: rgb(131, 141, 252);
  }

  &.cyan {
    color: rgb(0, 200, 255);
  }

  &.cyan-bright {
    color: rgb(134, 229, 255);
  }

  &.green {
    color: rgb(27, 98, 8);
  }

  &.green-bright {
    color: rgb(70, 189, 38);
  }

  &.magenta {
    color: rgb(147, 11, 133);
  }

  &.magenta-bright {
    color: rgb(218, 19, 198);
  }

  &.yellow {
    color: rgb(203, 182, 25);
  }

  &.red {
    color: rgb(206, 47, 47);
  }

  &.orange {
    color: rgb(236, 139, 65);
  }
}
</style>
