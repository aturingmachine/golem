import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Client, Intents } from 'discord.js'
import { registerCommands } from './commands'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { Config } from './utils/config'
import { logger } from './utils/logger'

export const debug = process.argv.slice(2).includes('debug')

let rl: readline.Interface
if (debug) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

const main = async () => {
  await TrackFinder.loadLibrary()

  if (debug) {
    logger.debug('>>> ENTERING INTERACTIVE DEBUG MODE')
    s()
  } else {
    initBot()
  }
}

function s() {
  rl.question('QUERY ("exit" to exit): \n>>> ', (ans) => {
    TrackFinder.search(ans)

    if (ans.toLowerCase() !== 'exit') {
      s()
    } else {
      initBot()
    }
  })
}

main()

function initBot(): void {
  registerCommands()

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
  })

  const eventFiles = fs
    .readdirSync(path.resolve(__dirname, './events'))
    .filter((file) => file.endsWith('.js'))

  for (const file of eventFiles) {
    logger.debug(`Attempting to load Event Handler: ${file}`)
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const event: EventHandler<any> = require(`./events/${file}`).default
    logger.debug(`Event Handler Loaded: ${event}`)
    if (event.once) {
      client.once(event.on, async (...args) => await event.execute(...args))
    } else {
      client.on(event.on, async (...args) => await event.execute(...args))
    }
    logger.debug(`Event Handler Registered: ${event.on}`)
  }

  logger.debug(Config.token)
  client
    .login(Config.token)
    .then(logger.debug)
    .catch((err) => {
      console.error('Login Blew Up')
      console.error(err)
      console.error(Object.keys(err))
    })
}
