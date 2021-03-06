import fs from 'fs'
import path from 'path'
import { Client, Guild, Intents, Interaction, Message, User } from 'discord.js'
import { Collection, Db, MongoClient } from 'mongodb'
import winston from 'winston'
import { GolemConf } from '../config'
import { CollectionNames } from '../constants'
import { LocalAlbumRecord } from '../db/records'
import { EventHandler } from '../events'
import { LastFm } from '../integrations/lastfm'
import { PlexConnection } from '../integrations/plex'
import { TrackListingInfo } from '../listing/listing'
import { ListingLoader } from '../listing/listing-loaders'
import {
  Permission,
  UserPermission,
  UserPermissionCache,
} from '../permissions/permission'
import { MusicPlayer } from '../player/music-player'
import { ListingFinder } from '../search/track-finder'
import { Debugger } from '../utils/debugger'
import { GolemLogger, LogSources } from '../utils/logger'
import { EzProgressBar } from '../utils/progress-bar'
import { GolemEvent, GolemEventEmitter } from './event-emitter'
import { PlayerCache } from './player-cache'
import { PresenceManager } from './presence-manager'

class GolemBot {
  private hasInitialized = false
  private log!: winston.Logger

  public permissions!: UserPermissionCache
  public playerCache!: PlayerCache
  public debugger!: Debugger
  public client!: Client
  public loader!: ListingLoader
  public events!: GolemEventEmitter
  public trackFinder!: ListingFinder
  public plex!: PlexConnection
  public db!: Db
  public mongo!: MongoClient
  public presence!: PresenceManager

  async initialize(): Promise<void> {
    if (!this.hasInitialized) {
      this.log = GolemLogger.child({ src: LogSources.App })

      this.mongo = new MongoClient(GolemConf.mongo.uri, {
        connectTimeoutMS: 5000,
      })

      await this.connectToMongo()

      this.permissions = new UserPermissionCache()
      this.playerCache = new PlayerCache()
      this.events = new GolemEventEmitter()
      this.debugger = new Debugger()
      this.loader = new ListingLoader()

      this.client = new Client({
        allowedMentions: {
          parse: ['users'],
        },
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_VOICE_STATES,
          Intents.FLAGS.GUILD_MESSAGES,
        ],
      })

      this.loadEventHandlers()

      await this.loader.load()

      this.log.verbose(`Loaded ${this.loader.listings.length} listings`)

      if (GolemConf.modules.Music) {
        this.trackFinder = new ListingFinder()
      }

      await this.connectToPlex()

      LastFm.init()
    }

    this.hasInitialized = true
  }

  // Search Without voice channel
  getPlayer(
    searchVal: string | Message | Interaction
  ): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      this.log.silly(`string get player for: "${searchVal}"`)
      return this.playerCache.get([searchVal, undefined])
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.log.verbose(`interaction get player for: ${searchVal.guild.id}`)
    return this.playerCache.get(searchVal)
  }

  async removePlayer(guildId: string, voiceChannelId: string): Promise<void> {
    this.log.info(`Deleting player for ${guildId} - ${voiceChannelId}`)
    this.playerCache.delete(guildId, voiceChannelId)
    await this.events.trigger(GolemEvent.Connection, guildId)
  }

  async login(): Promise<void> {
    await this.client.login(GolemConf.discord.token)

    this.log.silly(`attempting to set all guild owners to admin`)

    await Promise.all(
      this.client.guilds.cache.map(async (guild_) => {
        const guild = await guild_.fetch()
        this.log.silly(
          `setting owner and golem-admin to admin for ${guild.name}`
        )
        const ownerPerms = await UserPermission.get(guild.ownerId, guild.id)
        const golemAdminPerms = await UserPermission.get(
          GolemConf.discord.adminId,
          guild.id
        )

        if (!ownerPerms.permissions.has(Permission.Admin)) {
          ownerPerms.permissions.add(Permission.Admin)
          await ownerPerms.save()
        }

        if (!golemAdminPerms.permissions.has(Permission.Admin)) {
          golemAdminPerms.permissions.add(Permission.Admin)
          await golemAdminPerms.save()
        }
      })
    )

    this.presence = new PresenceManager()
  }

  setPresenceListening(listing: TrackListingInfo): void {
    this.playerCache.entries
    this.client.user?.setActivity({
      name: listing.title,
      type: 'LISTENING',
    })
  }

  setPresenceIdle(): void {
    this.client.user?.setActivity({
      name: 'Use $go get help to get started.',
    })
  }

  // TODO Maybe we can make a wrapper for this that is nicer to work with
  getUser(id: string): Promise<User> {
    return this.client.users.fetch(id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get database(): Record<CollectionNames, Collection<any>> {
    return {
      localalbums: Golem.db.collection<LocalAlbumRecord>('localalbums'),
      customaliases: Golem.db.collection('customaliases'),
      playrecords: Golem.db.collection('playrecords'),
      libindexes: Golem.db.collection('libindexes'),
      listings: Golem.db.collection('listings'),
      permissions: Golem.db.collection('permissions'),
    }
  }

  getGuild(id: string): Promise<Guild> {
    return this.client.guilds.fetch(id)
  }

  private loadEventHandlers(): void {
    this.log.info('Loading event handlers')
    const eventFiles = fs
      .readdirSync(path.resolve(__dirname, '../events'))
      .filter((file) => file.endsWith('.js') && file !== 'index.js')

    EzProgressBar.start(eventFiles.length)

    for (const file of eventFiles) {
      this.log.debug(`Attempting to load Event Handler: ${file}`)
      /* eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any  */
      const event: EventHandler<any> = require(`../events/${file}`).default
      this.log.debug(`Event Handler Loaded: ${event.on}`)
      if (event.once) {
        this.client.once(event.on, async (...args) => {
          try {
            await event.execute(...args)
          } catch (error) {
            GolemLogger.info(`Handler once-${event.on} error: ${error}`)
          }
        })
      } else {
        this.client.on(event.on, async (...args) => {
          try {
            await event.execute(...args)
          } catch (error) {
            GolemLogger.info(`Handler on-${event.on} error: ${error}`)
          }
        })
      }

      this.log.debug(`Event Handler Registered: ${event.on}`)
      EzProgressBar.add(1 / eventFiles.length, event.on)
    }

    EzProgressBar.add(1 / eventFiles.length)
    EzProgressBar.stop()
    this.log.info('Event Handlers loaded')
  }

  private async connectToMongo(): Promise<void> {
    this.log.info('connecting to database ' + GolemConf.mongo.dbName)
    try {
      await this.mongo.connect()
      this.db = this.mongo.db(GolemConf.mongo.dbName)
      this.log.info('connected to database')
    } catch (error) {
      this.log.error(`could not connect to database ${error}`)
      console.error(error)
    }
  }

  private async connectToPlex(): Promise<void> {
    this.plex = new PlexConnection()

    try {
      await this.plex.init(this.trackFinder)
    } catch (error) {
      this.log.error('plex connection failed')
      this.log.error(error)
      console.error((error as Error).stack)
    }
  }
}

export const Golem = new GolemBot()
