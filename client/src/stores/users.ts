import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

interface UserState {
  records: Record<string, any>
}

export const useUserStore = defineStore('users', {
  state: (): UserState => ({
    records: {},
  }),

  actions: {
    async fetch(ids: Set<string>) {
      const idsToUpdate = Array.from(ids).filter((id) => !this.records[id])

      if (idsToUpdate.length) {
        const response = await Http.get<{users: any[]}>(`/users/${idsToUpdate.join('|')}`)

        this.records = Object.fromEntries(response.users.map((u) => {
          return [u.id, u]
        }))
      }
    }
  }
})
