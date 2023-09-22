import type { ConfigurationOptions } from '@/models/config';
import { Http } from '@/utils/fetch';
import { defineStore } from 'pinia';

interface ConfigState {
  status: 'LOADING' | 'SUCCESS' | 'ERROR' | 'UNLOADED'
  record?: ConfigurationOptions
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    status: 'UNLOADED'
  }),

  getters: {
    canUpdate(): boolean {
      return this.status === 'ERROR' || this.status === 'SUCCESS'
    },
  },

  actions: {
    async fetch() {
      this.status = 'LOADING'

      const response = await Http.get<ConfigurationOptions>(`/config`)

      this.record = response

      this.status = 'SUCCESS'
    },

    async update(path: string, value: unknown) {
      this.status = 'LOADING'

      const response = await Http.put<ConfigurationOptions>(`/config`, { path, value })

      this.record = response

      this.status = 'SUCCESS'
    }
  }
})
