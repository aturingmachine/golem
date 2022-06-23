import { ClientEvents } from 'discord.js'

export interface EventHandler<K extends keyof ClientEvents> {
  on: K
  once?: boolean
  execute: (...args: ClientEvents[K]) => Promise<void> | void
}
