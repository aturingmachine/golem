import Vue from 'vue'
import Vuex from 'vuex'
import { getLogInfoColor } from '../utils/log-prettifier'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connections: [],
    nowPlaying: {},
    queues: {},
  },
  mutations: {
    setConnections(state, payload) {
      state.connections = [...payload.connections]
    },
    updateNowPlaying(state, payload) {
      const update = payload.nowplaying.nowPlaying ? payload.nowplaying : {...state.nowPlaying[payload.id], currentTime: payload.nowplaying.currentTime}

      state.nowPlaying = {
        ...state.nowPlaying,
        [payload.id]: update
      }
    },
    updateQueues(state, payload) {
      state.queues = {
        ...state.queues,
        [payload.id]: [...payload.queue]
      }

      // state.queues[payload.id].slice(0)
    },
  },
  actions: {
  },
  modules: {
    logs: {
      namespaced: true,
      state: {
        records: [],
        storeCount: 1000,
        viewCount: 500,
        filterString: '',
        selectedSources: [],
        selectedLevels: [],
      },
      getters: {
        filteredLogs(state) {
          if (
            state.selectedSources.length === 0 
            && state.selectedLevels.length === 0 
            && state.filterString.length === 0
          ) {
            console.log('No filtering, returning raw records')
            return state.records.slice(-state.viewCount)
          }

          console.log('using filters', {
            srcs: state.selectedSources,
            levels: state.selectedLevels,
            filter: state.filterString,
          })

          return state.records
            .filter(log => {
              const hasLevel = state.selectedLevels.length > 0 ? state.selectedLevels.includes(log.level) : true
              const hasSrc = state.selectedSources.length > 0 ? state.selectedSources.includes(log.src) : true
              const hasText = state.filterString.length > 0 ? log.message.toLowerCase().includes(state.filterString.toLowerCase()) : true

              return hasLevel && hasSrc && hasText
            })
            .slice(-state.viewCount)
        }
      },
      mutations: {
        filterQueue(state) {
          console.log(state.selectedSources)
          const isFiltered = state.selectedSources.includes('app')

          state.selectedSources = isFiltered ? [] : ['app']
        },
        filter(state, payload) {
          console.log(payload)
          state.selectedLevels = payload.levels
          state.selectedSources = payload.sources
          state.filterString = payload.filterString || ''
        },
        addLog(state, payload) {
          const updates = payload.logs.map(log => ({
            ...log,
            _client_level_class: getLogInfoColor(log.level),
            _client_src_class: getLogInfoColor(log.src)
          }))
    
          state.records = [...state.records, ...updates].slice(-state.storeCount)
        }
      }
    }
  }
})
