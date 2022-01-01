<template>
  <div class="page">
    <div class="filter-container">
      <v-container>
        <v-row>
          <v-form class="filter-form">
            <v-col cols="12" sm="6" md="3" class="pt-0 pb-0">
              <v-select
                v-model="selectedSources"
                @change="updateFilter()"
                :items="sources"
                label="Sources"
                multiple
                chips
                dense
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="3" class="pt-0 pb-0">
              <v-select
                v-model="selectedLevels"
                @change="updateFilter()"
                :items="logLevels"
                label="Log Levels"
                multiple
                chips
                dense
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="3" class="pt-0 pb-0">
              <v-form>
                <v-text-field
                  v-model="filterString"
                  label="Filter Logs"
                  @input="updateFilter()"
                  dense
                ></v-text-field>
              </v-form>
            </v-col>
          </v-form>
        </v-row>
      </v-container>
    </div>

    <div class="log-container">
      <pre v-if="logs.length" id="log-console">
        <v-simple-table>
          <template v-slot:default>
          <thead>
            <th class="text-left">level</th>
            <th class="text-left">source</th>
            <th>message</th>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td :class="`text-left log-level ${log._client_level_class}`"> {{ log.level }} </td>
              <td :class="`text-left log-src ${log._client_src_class}`"> {{ log.src.trim() }} </td>
              <td class="log-message"> {{ log.message }} </td>
            </tr>
          </tbody>
          </template>
        </v-simple-table>
      </pre>
      <div class="pl-5" v-else>No Logs Streamed</div>
    </div>
  </div>
</template>

<script>
import { LogWebSocketClient } from '../services/websocket-client'
import { logInfoClassMappings } from '../utils/log-prettifier'

export default {
  name: 'LogsPage',

  data: () => ({
    logsService: {},
    logLevels: ['info', 'verbose', 'debug', 'silly', 'warn', 'error'],
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
    },
  },

  methods: {
    updateFilter() {
      this.$store.commit('logs/filter', {
        levels: this.selectedLevels,
        sources: this.selectedSources,
        filterString: this.filterString,
      })
    },
  },

  mounted() {
    this.logsService = new LogWebSocketClient()

    this.logsService.addUpdateHandler((ev) => {
      try {
        this.$store.commit('logs/addLog', { logs: [JSON.parse(ev.data)] })

        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth',
        })
      } catch (error) {
        //
      }
    })
  },

  destroyed() {
    this.logsService.disconnect()
  },
}
</script>

<style lang="scss">
.filter-container {
  position: sticky;
  top: 60px;
  background: #121212;
  border-bottom: 2px #414141 solid;
  padding-bottom: 0;
  padding-top: 10px;
  box-shadow: 1px 1px 4px #414141;
}

.filter-form {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
}

.log-container {
  padding-bottom: 48px;
  padding-top: 20px;
}

.log-message {
  white-space: pre-line;
  word-wrap: break-word;
}

.log-level,
.log-src {
  text-align: left;
}

.log #log-console {
  padding-left: 0;
}

#log-console div {
  // white-space: pre-line;
  // word-break: break-word;
  margin-bottom: 0;
  padding: 3px 10px 3px 6px;
}

#log-console div:nth-child(even) {
  /* color: red; */
  background-color: rgba(255, 255, 255, 0.075);
}

#log-console td {
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
