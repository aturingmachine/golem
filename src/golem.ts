import fs from 'fs'
import path from 'path'
import { joinVoiceChannel } from '@discordjs/voice'
import { Client, Intents, Interaction, Message, Snowflake } from 'discord.js'
import winston from 'winston'
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
  private static players: Record<Snowflake, MusicPlayer>
  public static debugger: Debugger
  public static client: Client
  public static loader: TrackLoader
  public static trackFinder: TrackFinder

  static async initialize(): Promise<void> {
    Golem.players = {}
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

    Golem.trackFinder = new TrackFinder(Golem.loader.tracks)

    await Plex.init(Golem.trackFinder)
  }

  static getOrCreatePlayer(
    interaction: Interaction | Message
  ): MusicPlayer | undefined {
    if (!interaction.guild) {
      return undefined
    }

    const guildId = interaction.guild.id

    const voiceChannel =
      interaction.guild.members.cache.get(guildId)?.voice.channel

    Golem.log.debug(
      `getting player guild=${interaction.guild.name}, member=${interaction.member?.user.username}, voiceChannel=${voiceChannel?.id}`
    )

    if (!Golem.players[guildId]) {
      Golem.players[guildId] = new MusicPlayer(
        joinVoiceChannel({
          channelId: voiceChannel?.id || '',
          guildId: interaction.guildId || '',
          adapterCreator: interaction.guild.voiceAdapterCreator,
        })
      )
    }

    return Golem.players[guildId]
  }

  static getPlayer(
    searchVal: string | Message | Interaction
  ): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      return Golem.players[searchVal]
    }

    if (!searchVal.guild) {
      return undefined
    }

    return Golem.players[searchVal.guild.id]
  }

  static async login(): Promise<void> {
    Golem.client.login(Config.token)
  }
}
