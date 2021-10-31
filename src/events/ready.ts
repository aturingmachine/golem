import { Client } from 'discord.js'
import { EventHandler } from '../models/event-handler'
import { GolemLogger, LogSources } from '../utils/logger'

const ready: EventHandler<'ready'> = {
  on: 'ready',
  once: true,
  execute(client: Client): void {
    GolemLogger.info(`Ready! Logged in as ${client.user?.tag}`, {
      src: LogSources.Client,
    })
  },
}

export default ready
