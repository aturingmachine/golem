import fs from 'fs'
import path from 'path'
import { Client, Intents, Interaction, Message } from 'discord.js'
import winston from 'winston'
import { establishConnection } from '../db'
import { LastFm } from '../lastfm'
import { EventHandler } from '../models/event-handler'
import { TrackListingInfo } from '../models/listing'
import { MusicPlayer } from '../player/music-player'
import { TrackFinder } from '../player/track-finder'
import { TrackLoader } from '../player/track-loaders'
import { Plex } from '../plex'
import { GolemConf } from '../utils/config'
import { Debugger } from '../utils/debugger'
import { GolemLogger, LogSources } from '../utils/logger'
import { EzProgressBar } from '../utils/progress-bar'
import { GolemEvent, GolemEventEmitter } from './event-emitter'
import { PlayerCache } from './player-cache'

export class Golem {
  private static log: winston.Logger

  public static playerCache: PlayerCache
  public static debugger: Debugger
  public static client: Client
  public static loader: TrackLoader
  public static trackFinder: TrackFinder
  public static events: GolemEventEmitter

  static async initialize(): Promise<void> {
    Golem.log = GolemLogger.child({ src: LogSources.App })

    Golem.playerCache = new PlayerCache()
    Golem.events = new GolemEventEmitter()
    Golem.debugger = new Debugger()
    Golem.loader = new TrackLoader()

    Golem.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    })

    Golem.log.info('Loading event handlers')
    Golem.loadEventHandlers()
    Golem.log.info('Event Handlers loaded')

    await Golem.connectToMongo()

    await Golem.loader.load()

    Golem.log.verbose(`Loaded ${Golem.loader.listings.length} listings`)

    if (GolemConf.modules.Music) {
      Golem.trackFinder = new TrackFinder(Golem.loader.listings)
    }

    await Golem.connectToPlex()

    LastFm.init()
  }

  static getPlayer(
    searchVal: string | Message | Interaction
  ): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      Golem.log.silly(`string get player for: "${searchVal}"`)
      return Golem.playerCache.get(searchVal.trim())
    }

    if (!searchVal.guild) {
      return undefined
    }

    Golem.log.verbose(`interaction get player for: ${searchVal.guild.id}`)
    return Golem.playerCache.get(searchVal.guild.id)
  }

  static async removePlayer(guildId: string): Promise<void> {
    Golem.log.info(`Deleting player for ${guildId}`)
    Golem.playerCache.delete(guildId)
    await Golem.events.trigger(GolemEvent.Connection, guildId)
  }

  static async login(): Promise<void> {
    Golem.client.login(GolemConf.discord.token)
  }

  static setPresenceListening(listing: TrackListingInfo): void {
    Golem.client.user?.setActivity({
      name: listing.title,
      type: 'LISTENING',
    })
  }

  static setPresenceIdle(): void {
    Golem.client.user?.setActivity({
      name: 'Use $go help to get started.',
    })
  }

  private static loadEventHandlers(): void {
    const eventFiles = fs
      .readdirSync(path.resolve(__dirname, '../events'))
      .filter((file) => file.endsWith('.js'))

    EzProgressBar.start(eventFiles.length)

    for (const file of eventFiles) {
      Golem.log.debug(`Attempting to load Event Handler: ${file}`)
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const event: EventHandler<any> = require(`../events/${file}`).default
      Golem.log.debug(`Event Handler Loaded: ${event.on}`)
      if (event.once) {
        Golem.client.once(
          event.on,
          async (...args) => await event.execute(...args)
        )
      } else {
        Golem.client.on(
          event.on,
          async (...args) => await event.execute(...args)
        )
      }

      Golem.log.debug(`Event Handler Registered: ${event.on}`)
      EzProgressBar.add(1 / eventFiles.length, event.on)
    }

    EzProgressBar.add(1 / eventFiles.length)
    EzProgressBar.stop()
  }

  private static async connectToMongo(): Promise<void> {
    Golem.log.info('connecting to database')
    try {
      await establishConnection()
      Golem.log.info('connected to database')
    } catch (error) {
      Golem.log.error(`could not connect to database ${error}`)
      console.error(error)
    }
  }

  private static async connectToPlex(): Promise<void> {
    try {
      await Plex.init(Golem.trackFinder)
    } catch (error: any) {
      Golem.log.error('plex connection failed')
      Golem.log.error(error)
      console.error(error.stack)
    }
  }
}
