import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

export interface CachedStream {
  _id: string
  artist: string
  external_id: string
  initial_cache_date: string
  last_access_date: string
  thumbnail: string
  title: string
  type: string
}

interface CachedStreamStateRecord {
  status: 'Unloaded' | 'Loading' | 'Success' | 'Error'
  records: CachedStream[]
}

interface CachedStreamState {
  YouTube: CachedStreamStateRecord
}


export const useCachedStreamsStore = defineStore('cached-streams', {
  state: (): CachedStreamState => ({
    YouTube: {
      status: 'Unloaded',
      records: []
    }
  }),

  getters: {
    isLoading(): boolean {
      return this.YouTube.status === 'Loading'
    }
  },

  actions: {
    async fetch() {
      this.YouTube.status = 'Loading'

      const response = await Http.get<{entries: CachedStream[]}>(`/cache/YouTube`)

      this.YouTube.records = response.entries
      this.YouTube.status = 'Success'
    },

    async delete(id: string, type: string) {
      this.YouTube.status = 'Loading'
      
      const response = await Http.delete<{entries: CachedStream[]}>(`/cache/${type}/${id}`)

      this.YouTube.records = response.entries
      this.YouTube.status = 'Success'
    }
  }
})
