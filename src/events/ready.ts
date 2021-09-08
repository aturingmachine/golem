import { Client } from 'discord.js'
import { logger } from '../utils/logger'
import { EventHandler } from '~/models/event-handler'

const ready: EventHandler<'ready'> = {
  on: 'ready',
  once: true,
  execute(client: Client): void {
    logger.info(`Ready! Logged in as ${client.user?.tag}`)
  },
}

export default ready
