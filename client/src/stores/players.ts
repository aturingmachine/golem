import type { MusicPlayerJSON } from '@/models/players';
import { safeArray } from '@/utils/arrays';
import { Http } from '@/utils/fetch';
import { WebSocketClient } from '@/utils/ws';
import { defineStore } from 'pinia';

type PlayersResponse = { players: MusicPlayerJSON[] }

export type PlayersState = {
  records: Record<string, MusicPlayerJSON>
}

export const usePlayersStore = defineStore('players', {
  state: (): PlayersState => ({
    records: {},
  }),

  getters: {
    list(): MusicPlayerJSON[] {
      return Object.values(this.records)
    }
  },

  actions: {
    startPolling() {
      WebSocketClient.listen(
        'playerStorePolling',
        'players_update',
        (data: PlayersResponse) => {
          this.process(data.players)
        }
      )
    },

    async fetch() {
      const response = await Http.get<PlayersResponse>('/players')

      this.process(response.players)
    },

    process(players: MusicPlayerJSON[] | MusicPlayerJSON) {
      const arr = safeArray(players)

      const updates = Object.fromEntries(arr.map((player) => [player.guild.id, player]))

      this.records = {
        ...this.records,
        ...updates,
      }
    }
  }
})
