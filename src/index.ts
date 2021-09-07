// Require the necessary discord.js classes
import fs from 'fs'
import path from 'path'
import { Client, Intents } from 'discord.js'
import { registerCommands } from './commands'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { Config } from './utils/config'

TrackFinder.load3()
// const resp = TrackFinder.search('tt')
// console.log('SEARCHED')
// console.log(resp)
// process.exit(0)

registerCommands()

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

const eventFiles = fs
  .readdirSync(path.resolve(__dirname, './events'))
  .filter((file) => file.endsWith('.js'))

console.log(eventFiles)

for (const file of eventFiles) {
  console.log('Attempting to load Event Handler:', file)
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const event: EventHandler<any> = require(`./events/${file}`).default
  console.log('Event Handler Loaded:', event)
  if (event.once) {
    client.once(event.on, async (...args) => await event.execute(...args))
  } else {
    client.on(event.on, async (...args) => await event.execute(...args))
  }
  console.log('Event Handler Registered:', event.on)
}

console.log(Config.token)
client
  .login(Config.token)
  .then(console.log)
  .catch((err) => {
    console.error('Login Blew Up')
    console.error(err)
    console.error(Object.keys(err))
  })
