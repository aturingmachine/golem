import { Client } from 'discord.js'
import { EventHandler } from '~/models/event-handler'

const ready: EventHandler<'ready'> = {
  on: 'ready',
  once: true,
  execute(client: Client): void {
    console.log(`Ready! Logged in as ${client.user?.tag}`)
  },
}

export default ready
