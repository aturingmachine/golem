import fs from 'fs'
import path from 'path'
import { Injectable } from '@nestjs/common'
import { Client, Guild, Intents, Interaction, Message, User } from 'discord.js'
import { GolemConf } from '../config'
import { EventHandler } from '../events'
import { LastFm } from '../integrations/lastfm'
import { PlexConnection } from '../integrations/plex'
import { ListingLoader } from '../listing/listing-loaders'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'
import { MusicPlayer } from '../music/player/music-player'
import {
  Permission,
  UserPermission,
  UserPermissionCache,
} from '../permissions/permission'
import { Debugger } from '../utils/debugger'
import { EzProgressBar } from '../utils/progress-bar'
import { GolemEvent, GolemEventEmitter } from './event-emitter'
import { PlayerCache } from './player-cache'

@Injectable()
export class GolemBot {
  private hasInitialized = false

  public permissions!: UserPermissionCache
  public debugger!: Debugger
  public client!: Client
  public plex!: PlexConnection

  constructor(
    private logger: GolemLogger,
    private config: GolemConf,
    private playerCache: PlayerCache,
    private events: GolemEventEmitter,
    private loader: ListingLoader
  ) {
    this.logger.setContext(LogContexts.Bot)
  }

  async initialize(): Promise<void> {
    if (!this.hasInitialized) {
      this.permissions = new UserPermissionCache()
      this.debugger = new Debugger()

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

      this.logger.verbose(`Loaded ${this.loader.listings.length} listings`)

      if (this.config.modules.Music) {
        // this.trackFinder = new ListingFinder()
      }

      // await this.connectToPlex()

      LastFm.init()
    }

    this.hasInitialized = true
  }

  // Search Without voice channel
  getPlayer(
    searchVal: string | Message | Interaction
  ): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      this.logger.silly(`string get player for: "${searchVal}"`)
      return this.playerCache.get([searchVal, undefined])
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.logger.verbose(`interaction get player for: ${searchVal.guild.id}`)
    return this.playerCache.get(searchVal)
  }

  async removePlayer(guildId: string, voiceChannelId: string): Promise<void> {
    this.logger.info(`Deleting player for ${guildId} - ${voiceChannelId}`)
    this.playerCache.delete(guildId, voiceChannelId)
    await this.events.trigger(GolemEvent.Connection, guildId)
  }

  async login(): Promise<void> {
    await this.client.login(this.config.discord.token)

    this.logger.silly(`attempting to set all guild owners to admin`)

    await Promise.all(
      this.client.guilds.cache.map(async (guild_) => {
        const guild = await guild_.fetch()
        this.logger.silly(
          `setting owner and golem-admin to admin for ${guild.name}`
        )
        const ownerPerms = await UserPermission.get(guild.ownerId, guild.id)
        const golemAdminPerms = await UserPermission.get(
          this.config.discord.adminId,
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
  }

  // TODO Maybe we can make a wrapper for this that is nicer to work with
  getUser(id: string): Promise<User> {
    return this.client.users.fetch(id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // get database(): Record<CollectionNames, Collection<any>> {
  //   return {
  //     localalbums: Golem.db.collection<LocalAlbumRecord>('localalbums'),
  //     customaliases: Golem.db.collection('customaliases'),
  //     playrecords: Golem.db.collection('playrecords'),
  //     libindexes: Golem.db.collection('libindexes'),
  //     listings: Golem.db.collection('listings'),
  //     permissions: Golem.db.collection('permissions'),
  //   }
  // }

  getGuild(id: string): Promise<Guild> {
    return this.client.guilds.fetch(id)
  }

  private loadEventHandlers(): void {
    this.logger.info('Loading event handlers')
    const eventFiles = fs
      .readdirSync(path.resolve(__dirname, '../events'))
      .filter((file) => file.endsWith('.js') && file !== 'index.js')

    EzProgressBar.start(eventFiles.length)

    for (const file of eventFiles) {
      this.logger.debug(`Attempting to load Event Handler: ${file}`)
      /* eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any  */
      const event: EventHandler<any> = require(`../events/${file}`).default
      this.logger.debug(`Event Handler Loaded: ${event.on}`)
      if (event.once) {
        this.client.once(event.on, async (...args) => {
          try {
            await event.execute(...args)
          } catch (error) {
            this.logger.info(`Handler once-${event.on} error: ${error}`)
          }
        })
      } else {
        this.client.on(event.on, async (...args) => {
          try {
            await event.execute(...args)
          } catch (error) {
            this.logger.info(`Handler on-${event.on} error: ${error}`)
          }
        })
      }

      this.logger.debug(`Event Handler Registered: ${event.on}`)
      EzProgressBar.add(1 / eventFiles.length, event.on)
    }

    EzProgressBar.add(1 / eventFiles.length)
    EzProgressBar.stop()
    this.logger.info('Event Handlers loaded')
  }
}
