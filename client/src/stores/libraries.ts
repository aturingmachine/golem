import type { Library } from '@/models/libraries';
import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

type LibraryState = {
  records: Record<string, Library>
}

export const useLibrariesStore = defineStore('libraries', {
  state: (): LibraryState => ({
    records: {}
  }),

  actions: {
    async fetch() {
      const response = await Http.get<{ libraries: Library[] }>('/libraries')

      this.records = Object.fromEntries(response.libraries.map((l) => [l.id, l]))
    }
  },
})
