import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Client, Intents } from 'discord.js'
import { registerCommands } from './commands'
import { establishConnection } from './db'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { Plex } from './plex'
import { Config, opts } from './utils/config'
import { logger } from './utils/logger'

const log = logger.child({ src: 'main' })

let client: Client

let rl: readline.Interface
if (opts.debug) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

const main = async () => {
  log.info('Connecting to database')
  await establishConnection()
  log.info('Connection established')

  await TrackFinder.loadLibrary()

  await Plex.init()

  if (opts.image) {
    process.exit(0)
  }

  if (opts.debug) {
    log.debug('>>> ENTERING INTERACTIVE DEBUG MODE')
    debugPrompt()
  } else {
    initBot()
  }
}

function debugPrompt() {
  rl.question(
    'QUERY ("exit" to start bot; "kill" to kill process): \n>>> ',
    (ans) => {
      const result = TrackFinder.search(ans)

      log.debug(
        `DEBUG >>>\n\tResult=${result?.listing.names.short.piped};\n\tArtistQuery=${result?.isArtistQuery};\n\tWideMatch=${result?.isWideMatch};\n\tGenres=${result?.listing.genres}`
      )

      if (ans.toLowerCase() === 'exit') {
        initBot()
      } else if (ans.toLowerCase() === 'kill') {
        process.exit(0)
      } else {
        debugPrompt()
      }
    }
  )
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
      log.debug(`Client Debug >>>\n${msg}`)
    })
  }

  log.info(`Cient Running With: ${client.options.intents}`)

  const eventFiles = fs
    .readdirSync(path.resolve(__dirname, './events'))
    .filter((file) => file.endsWith('.js'))

  for (const file of eventFiles) {
    log.debug(`Attempting to load Event Handler: ${file}`)
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const event: EventHandler<any> = require(`./events/${file}`).default
    log.debug(`Event Handler Loaded: ${event}`)
    if (event.once) {
      client.once(event.on, async (...args) => await event.execute(...args))
    } else {
      client.on(event.on, async (...args) => await event.execute(...args))
    }
    log.debug(`Event Handler Registered: ${event.on}`)
  }

  log.debug(Config.token)
  client
    .login(Config.token)
    .then(log.debug)
    .catch((err) => {
      console.error('Login Blew Up')
      console.error(err)
      console.error(Object.keys(err))
    })
}

export const getClient = (): Client => client
