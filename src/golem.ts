import fs from 'fs'
import path from 'path'
import { Client, Intents } from 'discord.js'
import winston from 'winston'
import { establishConnection } from './db'
import { EventHandler } from './models/event-handler'
import { TrackFinder } from './player/track-finder'
import { TrackLoader } from './player/track-loaders'
import { Plex } from './plex'
import { Config } from './utils/config'
import { Debugger } from './utils/debugger'
import { logger } from './utils/logger'

export class Golem {
  private readonly log: winston.Logger
  public readonly debugger: Debugger
  public client: Client
  public loader: TrackLoader
  public trackFinder!: TrackFinder

  constructor() {
    this.log = logger.child({ src: 'app' })
    this.debugger = new Debugger()

    this.loader = new TrackLoader()

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    })

    const eventFiles = fs
      .readdirSync(path.resolve(__dirname, './events'))
      .filter((file) => file.endsWith('.js'))

    for (const file of eventFiles) {
      this.log.debug(`Attempting to load Event Handler: ${file}`)
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const event: EventHandler<any> = require(`./events/${file}`).default
      this.log.debug(`Event Handler Loaded: ${event}`)
      if (event.once) {
        this.client.once(
          event.on,
          async (...args) => await event.execute(...args)
        )
      } else {
        this.client.on(
          event.on,
          async (...args) => await event.execute(...args)
        )
      }
      this.log.debug(`Event Handler Registered: ${event.on}`)
    }
  }

  async initialize(): Promise<void> {
    this.log.info('connecting to database')
    await establishConnection()
    this.log.info('connected to database')

    await this.loader.load()

    this.trackFinder = new TrackFinder(this.loader.tracks)

    await Plex.init()
  }

  async login(): Promise<void> {
    this.client.login(Config.token)
  }
}
