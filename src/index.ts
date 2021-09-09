import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Client, Intents } from 'discord.js'
import { registerCommands } from './commands'
import { establishConnection } from './db'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { Config, opts } from './utils/config'
import { fourSquare } from './utils/image-helpers'
import { logger } from './utils/logger'

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
    const srcs = TrackFinder.artistSample('LOONA')

    try {
      const img = await fourSquare({
        images: {
          img1: srcs[0].albumArt,
          img2: srcs[1].albumArt,
          img3: srcs[2].albumArt,
          img4: srcs[3].albumArt,
        },
        size: 80,
      })
      img.toString('base64')
      console.log(img.toString('base64'))
    } catch (error) {
      console.error(error)
    }
    process.exit(0)
  }

  if (opts.debug) {
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

if (!opts.noRun) {
  main()
}

function initBot(): void {
  registerCommands()

  const client = new Client({
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
