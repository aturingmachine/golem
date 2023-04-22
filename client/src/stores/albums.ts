import type { Album } from '@/models/album';
import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

type AlbumsState = {
  records: Record<string, Album>
}

export const useAlbumsStore = defineStore('albums', {
  state: (): AlbumsState => ({
    records: {},
  }),

  getters: {
    allAlbums(): Album[] {
      return Object.values(this.records)
    }
  },

  actions: {
    async fetch() {
      const response = await Http.get<{ albums: Album[] }>('/albums')

      this.records = Object.fromEntries(response.albums.map((a) => [a._id, a]))
    }
  }
})
