import { Snowflake } from 'discord.js'
import { GolemLogger } from '../utils/logger'

type GolemEventHandler = (guildId: string) => Promise<void> | void

export enum GolemEvent {
  Connection = 'connection',
  Queue = 'queue',
}

export class GolemEventEmitter {
  private static log = GolemLogger.child({ src: 'events' })
  private handlers: Record<GolemEvent, Map<Snowflake, GolemEventHandler>> = {
    connection: new Map(),
    queue: new Map(),
  }

  on(event: GolemEvent, name: string, handler: GolemEventHandler): void {
    this.handlers[event].set(name, handler)
  }

  off(event: GolemEvent, name: string): void {
    this.handlers[event].delete(name)
  }

  async trigger(event: GolemEvent | 'all', guildId: string): Promise<void> {
    GolemEventEmitter.log.silly(`triggering ${event} for ${guildId}`)
    if (event === 'all') {
      for (const e of Object.values(this.handlers)) {
        for (const handler of e.values()) {
          await handler(guildId)
        }
      }
    } else {
      for (const handler of this.handlers[event].values()) {
        await handler(guildId)
      }
    }
  }
}
