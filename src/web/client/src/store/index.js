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
    }
  },
  actions: {
  },
  modules: {
  }
})
