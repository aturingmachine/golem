import fs from 'fs'
import path from 'path'
import { joinVoiceChannel } from '@discordjs/voice'
import { Client, Intents, Interaction, Message, Snowflake } from 'discord.js'
import { terminal, Terminal } from 'terminal-kit'
import winston from 'winston'
import { establishConnection } from './db'
import { LastFm } from './lastfm'
import { EventHandler } from './models/event-handler'
import { MusicPlayer } from './player/music-player'
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

  private static progressBar: Terminal.ProgressBarController
  public static progress = 0

  static async initialize(): Promise<void> {
    Golem.progressBar = terminal.progressBar({
      width: 80,
      percent: true,
      inline: true,
    })
    Golem.players = new Map()
    Golem.addProgress(1)
    Golem.log = GolemLogger.child({ src: LogSources.App })
    Golem.debugger = new Debugger()
    Golem.addProgress(2)

    Golem.loader = new TrackLoader()
    Golem.addProgress(5)

    Golem.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    })
    Golem.addProgress(3)

    const eventFiles = fs
      .readdirSync(path.resolve(__dirname, './events'))
      .filter((file) => file.endsWith('.js'))
    Golem.addProgress(2)

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
      Golem.addProgress(1)
    }

    Golem.log.info('connecting to database')
    await establishConnection()
    Golem.log.info('connected to database')
    Golem.addProgress(3)

    await Golem.loader.load()

    Golem.log.debug(`Loaded ${Golem.loader.listings.length} listings`)
    Golem.addProgress(1)

    Golem.trackFinder = new TrackFinder(Golem.loader.listings)
    Golem.addProgress(4)

    try {
      await Plex.init(Golem.trackFinder)
      Golem.addProgress(2)
    } catch (error) {
      Golem.log.error('plex connection failed')
      Golem.log.error(error)
    }

    LastFm.init()
    Golem.addProgress(4)
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

  static addProgress(p: number): void {
    Golem.progress += p / 100
    Golem.progressBar.update({
      progress: Golem.progress,
    })

    if (Golem.progress >= 1) {
      Golem.progressBar.stop()
    }
  }
}
