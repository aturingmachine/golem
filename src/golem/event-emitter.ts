import { Snowflake } from 'discord-api-types'

type GolemEventHandler = (guildId: string) => Promise<void>

export enum GolemEvent {
  Connection = 'connection',
  Queue = 'queue',
}

export class GolemEventEmitter {
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
