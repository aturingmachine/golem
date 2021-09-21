import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connections: [],
    nowPlaying: {},
    queues: {}
  },
  mutations: {
    setConnections(state, payload) {
      state.connections = [...payload.connections]
    },
    updateNowPlaying(state, payload) {
      state.nowPlaying = {
        ...state.nowPlaying,
        [payload.id]: payload.nowplaying
      }
    },
    updateQueues(state, payload) {
      state.queues = {
        ...state.queues,
        [payload.id]: payload.queue
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
