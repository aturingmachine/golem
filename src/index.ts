import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Client, Intents } from 'discord.js'
import { registerCommands } from './commands'
import { establishConnection } from './db'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { Config, opts } from './utils/config'
import { GoGet } from './utils/go-get-handler'
import { fourSquare } from './utils/image-helpers'
import { logger } from './utils/logger'

let client: Client

let rl: readline.Interface
if (opts.debug) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

const main = async () => {
  logger.info('Connecting to database')
  await establishConnection()
  logger.info('Connection established')

  await TrackFinder.loadLibrary()

  if (opts.image) {
    console.log(GoGet.catalog)
    process.exit(0)
  }

  if (opts.debug) {
    logger.debug('>>> ENTERING INTERACTIVE DEBUG MODE')
    // initBot()
    s()
  } else {
    initBot()
  }
}

function s() {
  rl.question('QUERY ("exit" to exit): \n>>> ', (ans) => {
    const result = TrackFinder.search(ans)

    logger.debug(
      `DEBUG >>>\n\tResult=${result?.listing.names.short.piped};\n\tArtistQuery=${result?.isArtistQuery};\n\tWideMatch=${result?.isWideMatch}`
    )

    if (ans.toLowerCase() !== 'exit') {
      s()
    } else {
      // initBot()
      process.exit(0)
    }
  })
}

if (!opts.noRun) {
  main()
}

function initBot(): void {
  registerCommands()

  client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGES,
    ],
  })

  if (opts.verbose) {
    client.on('debug', (msg) => {
      logger.debug(`Client Debug >>>\n${msg}`)
    })
  }

  logger.info(`Cient Running With: ${client.options.intents}`)

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

export const getClient = (): Client => client
