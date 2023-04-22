import type { ResourceData } from '@/models/resource-usage';
import { WebSocketClient } from '@/utils/ws';
import { defineStore } from 'pinia';

interface ResourceState {
  history: Omit<ResourceData, 'totalmem'>[]
  totalMem: number
}

type ResourceResponse = {
  data: ResourceData
}

export const useResourceStore = defineStore('resources', {
  state: (): ResourceState => ({
    history: [],
    totalMem: -1,
  }),

  getters: {
    current(): Omit<ResourceData, 'totalmem'> {
      return this.history.at(-1)!
    }
  },

  actions: {
    startPolling() {
      WebSocketClient.listen(
        'resourceStorePolling',
        'resource_update',
        (data: ResourceResponse) => {
          this.update(data.data)
        }
      )
    },

    update(data: ResourceData) {
      this.totalMem = data.totalmem

      const newData = { 
        load: data.load, 
        freemem: data.freemem, 
        uptime: data.uptime,  
      }

      if (this.history.length > 60) {
        this.history = [...this.history.slice(1), newData]
      } else {
        this.history.push(newData)
      }
    }
  },
})
