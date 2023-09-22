import { defineStore } from 'pinia';
import { useAlbumsStore } from './albums';
import { useLibrariesStore } from './libraries';
import { useListingsStore } from './listings';
import { usePlayersStore } from './players';
import { v4 } from 'uuid'
import { useGuildsStore } from './guilds';
import { useAuditsStore } from './audits';
import { useResourceStore } from './resources';
import { useConfigStore } from './configuration';

export interface SnackbarData {
  id: string
  type: 'success' | 'error' | 'warning'
  text: string
  timeout?: number

  button?: {
    text: string
    onClick?: () => void | Promise<void>
  }
}

interface AppState {
  snackbar: {
    queue: SnackbarData[]
    data?: SnackbarData
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    snackbar: {
      queue: []
    }
  }),

  actions: {
    async fetchAllData() {
      const config = useConfigStore()
      const albums = useAlbumsStore()
      const libraries = useLibrariesStore()
      const listings = useListingsStore()
      const players = usePlayersStore()
      const guilds = useGuildsStore()

      await Promise.all([
        config.fetch(),
        guilds.fetch(),
        albums.fetch(),
        libraries.fetch(),
        listings.fetch(),
        players.fetch(),
      ])
    },

    initPolling() {
      const players = usePlayersStore()
      const audits = useAuditsStore()
      const resources = useResourceStore()

      players.startPolling()
      audits.startPolling()
      resources.startPolling()
    },

    promptSnackbar(params: Omit<SnackbarData, 'id'>) {
      const id = v4()
      const data = { ...params, id }


      if (this.snackbar.data) {
        this.snackbar.queue.push(data)
      } else {
        this.snackbar.data = data
      }
    },

    removeSnackbar() {
      const next = this.snackbar.queue[0]

      this.snackbar.queue = [...this.snackbar.queue.slice(1)]
      this.snackbar.data = undefined

      setTimeout(() => {
        this.snackbar.data = next
      }, 300)
    }
  }
})
