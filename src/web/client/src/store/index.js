import Vue from 'vue'
import Vuex from 'vuex'
import { AnalyticsService } from '../services/analytics.service'
import { ListingService } from '../services/listings.service'
import { getLogInfoColor } from '../utils/log-prettifier'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connections: {
      status: 'unloaded',
      records: []
    },
    nowPlaying: {},
    queues: {},
    analytics: [],
  },

  getters: {
    nowPlaying: (state, getters, rootState) => (guildId) => {
      const record = state.nowPlaying[guildId]

      if (!record) {
        return undefined
      }

      if (typeof record.listing === 'string') {
        return { ...rootState.listings.records[record.listing]?.listing }
      }

      return record.listing
    },

    queue: (state, getters, rootState) => (guildId) => {
      const record = state.queues[guildId]

      if (!record) {
        return []
      }

      const result = []

      for (const item of record) {
        if (typeof item === 'object') {
          result.push(item)
          continue
        }

        result.push({ ...rootState.listings.records[item]?.listing })
      }

      return result
    }
  },

  mutations: {
    setConnections(state, payload) {
      state.connections.status = 'loaded'
      state.connections.records = [...payload.connections]
    },
    updateNowPlaying(state, payload) {
      const update = payload.nowplaying.listing ? payload.nowplaying : { ...state.nowPlaying[payload.id], currentTime: payload.nowplaying.currentTime }

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
    updateAnalytics(state, payload) {
      state.analytics = [...payload]
    }
  },

  actions: {
    async getAnalytics({ commit }) {
      try {
        const res = await AnalyticsService.get()

        commit('updateAnalytics', res.records)
      } catch (error) {
        console.error(error)
      }
    }
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
            return state.records.slice(-state.viewCount)
          }

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
          const isFiltered = state.selectedSources.includes('app')

          state.selectedSources = isFiltered ? [] : ['app']
        },
        filter(state, payload) {
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
    },
    albums: {
      namespaced: true,
      state: {
        records: {}
      },

      getters: {
        album(state) {
          return (id) => {
            const albumRecord = state.records[id]
            return albumRecord
          }
        },

        art: (state) => (id) => {
          if (id.startsWith('http')) {
            return id
          }

          return `data:image/png;base64,${state.records[id]?.album?.art}`
        }
      },

      mutations: {
        setLoading(state, payload) {
          state.records = {
            ...state.records,
            [payload.id]: {
              status: 'loading',
              album: undefined
            }
          }
        },

        addAlbum(state, payload) {
          state.records = {
            ...state.records,
            [payload.id]: {
              status: 'loaded',
              album: payload.album,
            }
          }
        }
      },

      actions: {
        async getAlbum({ commit, state }, id) {
          const existing = state.records[id]

          if (!!existing?.album || existing?.status === 'loading') {
            return
          }

          commit('setLoading', { id })

          try {
            const response = await ListingService.getAlbum(id)

            commit('addAlbum', { id, album: response.album })
          } catch (error) {
            console.error(error)
          }
        }
      },
    },

    listings: {
      namespaced: true,
      state: {
        status: 'unloaded',
        records: {},
        ids: [],
        idOffset: 0
      },

      mutations: {
        setIdsLoading(state) {
          state.status = 'loading'
        },

        addListingIds(state, payload) {
          state.status = 'loaded'
          state.ids = [...state.ids, ...payload]
          state.idOffset += 200
        },

        setListingLoading(state, payload) {
          state.records = {
            ...state.records,
            [payload.id]: {
              status: 'loading',
              listing: undefined
            }
          }
        },

        addListing(state, payload) {
          state.records = {
            ...state.records,
            [payload.id]: {
              status: 'loaded',
              listing: payload.listing
            }
          }
        }
      },

      actions: {
        async getListing({ commit, state }, ids) {
          const idsToGet = Array.isArray(ids) ? ids : [ids]

          for (const id of idsToGet) {
            const record = state.records[id]

            if (!!record?.listing || record?.status === 'loading') {
              return
            }

            commit('setListingLoading', { id })

            try {
              const response = await ListingService.getById(id)

              commit('addListing', { id, listing: response.listing })
              this.dispatch('albums/getAlbum', response.listing.album)
            } catch (error) {
              console.error(error)
            }
          }
        },

        async getListings({ commit, state }) {
          if (state.status !== 'unloaded') {
            return
          }

          commit('setIdsLoading')

          try {
            let shouldFetch = true

            while (shouldFetch) {
              const res = await ListingService.get(state.idOffset)

              shouldFetch = res.hasMore

              commit('addListingIds', res.listingIds)
            }
          } catch (error) {
            console.error(error)
          }

        }
      }
    }
  }
})
