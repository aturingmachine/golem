import type { AuditRecord } from '@/models/audits';
import { safeArray } from '@/utils/arrays';
import { WebSocketClient } from '@/utils/ws';
import { defineStore } from 'pinia';
import { useUserStore } from './users';

interface AuditLogState  {
  records: Record<string, Record<string, AuditRecord>>
}

type AuditUpdate = {
  audits: AuditRecord[]
}

export const useAuditsStore = defineStore('audit-logs', {
  state: (): AuditLogState => ({
    records: {}
  }),

  getters: {
    forGuild(): GetterFn<[string], AuditRecord[]> {
      return (guildId): AuditRecord[] => {
        console.log('Fetching audits for', guildId)
        return Object.values(this.records[guildId] || {}).sort((a, b) => {
          return b.timestamp - a.timestamp
        })
      }
    }
  },

  actions: {
    startPolling() {
      WebSocketClient.listen(
        'auditLogStorePolling',
        'audit_update',
        (data: AuditUpdate) => {
          this.add(data.audits)
        }
      )
    },
    
    add(records: AuditRecord[] | AuditRecord) {
      const updates: Record<string, Record<string, AuditRecord>> = {}
      const userIds = new Set<string>()

      const arr = safeArray(records)

      arr.forEach((record) => {
        userIds.add(record.userId)

        if (updates[record.guildId]) {
          updates[record.guildId] = {
            ...updates[record.guildId],
            [record._id]: record,
          }
        } else {
          updates[record.guildId] = {
            [record._id]: record,
          }
        }
      })


      Object.keys(updates).forEach((guildId) => {
        console.log(guildId)
        const target = this.records[guildId]

        if (target) {
          this.records[guildId] = {
            ...this.records[guildId],
            ...updates[guildId]
          }
        } else {
          this.records[guildId] = updates[guildId]
        }
      })

      console.log(Array.from(userIds))

      if (userIds.size > 0) {
        const users = useUserStore()

        users.fetch(userIds)
      }
    }
  }
})
