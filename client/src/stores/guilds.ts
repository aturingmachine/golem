import type { Guild } from '@/models/guilds';
import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

interface GuildsState {
  records: Record<string, Guild>
}

export const useGuildsStore = defineStore('guilds', {
  state: (): GuildsState => ({
    records: {},
  }),

  getters: {
    list(): any[] {
      return Object.values(this.records)
    },
  },

  actions: {
    async fetch() {
      const response = await Http.get<{ guilds: Guild[] }>('/guilds')

      this.records = Object.fromEntries(response.guilds.map((guild) => [guild.id, guild]))

      return response
    }
  },
})
