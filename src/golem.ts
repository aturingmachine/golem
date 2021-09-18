import fs from 'fs'
import path from 'path'
import { joinVoiceChannel } from '@discordjs/voice'
import { Client, Intents, Interaction, Message, Snowflake } from 'discord.js'
import winston, { loggers } from 'winston'
import { establishConnection } from './db'
import { EventHandler } from './models/event-handler'
import { MusicPlayer } from './player/beta-music-player'
import { TrackFinder } from './player/track-finder'
import { TrackLoader } from './player/track-loaders'
import { Plex } from './plex'
import { Config } from './utils/config'
import { Debugger } from './utils/debugger'
import { GolemLogger, LogSources } from './utils/logger'

export class Golem {
  private static log: winston.Logger
  public static players: Map<Snowflake, MusicPlayer>
  public static debugger: Debugger
  public static client: Client
  public static loader: TrackLoader
  public static trackFinder: TrackFinder

  static async initialize(): Promise<void> {
    Golem.players = new Map()
    Golem.log = GolemLogger.child({ src: LogSources.App })
    Golem.debugger = new Debugger()

    Golem.loader = new TrackLoader()

    Golem.client = new Client({
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
      Golem.log.debug(`Attempting to load Event Handler: ${file}`)
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const event: EventHandler<any> = require(`./events/${file}`).default
      Golem.log.debug(`Event Handler Loaded: ${event}`)
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
    }

    Golem.log.info('connecting to database')
    await establishConnection()
    Golem.log.info('connected to database')

    await Golem.loader.load()

    Golem.log.debug(`Loaded ${Golem.loader.listings.length} listings`)

    Golem.trackFinder = new TrackFinder(Golem.loader.listings)

    try {
      await Plex.init(Golem.trackFinder)
    } catch (error) {
      Golem.log.error('plex connection failed')
      Golem.log.error(error)
    }
  }

  static getOrCreatePlayer(
    interaction: Interaction | Message
  ): MusicPlayer | undefined {
    const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
    const member = guild?.members.cache.get(interaction.member?.user.id || '')
    const voiceChannel = member?.voice.channel

    Golem.log.debug(
      `getting player guild=${guild?.name}, member=${member?.user.username}, voiceChannel=${voiceChannel?.id}`
    )

    if (!interaction.guild || !interaction.guildId) {
      this.log.warn('no guild, cannot get player')
      return undefined
    }

    const guildId = interaction.guildId

    if (!Golem.players.has(guildId)) {
      this.log.debug(`no player for ${guildId} - creating new`)
      Golem.players.set(
        guildId,
        new MusicPlayer(
          joinVoiceChannel({
            channelId: voiceChannel?.id || '',
            guildId: interaction.guildId || '',
            adapterCreator: interaction.guild.voiceAdapterCreator,
          })
        )
      )
    }

    return Golem.players.get(guildId)
  }

  static getPlayer(
    searchVal: string | Message | Interaction
  ): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      this.log.debug(`string get player for: "${searchVal}"`)
      return Golem.players.get(searchVal.trim())
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.log.debug(`interaction get player for: ${searchVal.guild.id}`)
    return Golem.players.get(searchVal.guild.id)
  }

  static removePlayer(channelId: string): void {
    Golem.players.delete(channelId)
  }

  static async login(): Promise<void> {
    Golem.client.login(Config.Discord.Token)
  }

  static disconnectAll(): void {
    this.log.info('Disconnection players')
    Golem.players.forEach((player) => {
      player.disconnect()
    })
  }
}
