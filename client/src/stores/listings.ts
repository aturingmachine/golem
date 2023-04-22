import { defineStore } from 'pinia'
import { Http } from '@/utils/fetch'
import type { LocalListing } from '@/models/listings'
import type { Album } from '@/models/album'

type ListingsState = {
  records: Record<string, LocalListing>
}


export const useListingsStore = defineStore('listings', {
  state: (): ListingsState => ({
    records: {}
  }),

  getters: {
    list(): LocalListing[] {
      return Object.values(this.records)
    },

    forAlbum(): GetterFn<[Album], LocalListing[]> {
      return (album): LocalListing[] => {
        return this.list.filter((listing) => {
          return listing.albumId === album._id
        })
      }
    }
  },

  actions: {
    async fetch() {
      const response = await Http.get<{listings: LocalListing[]}>('/listings')

      this.records = Object.fromEntries(response.listings.map((l) => [l.listingId, l]))

      return response
    }
  }
})
