import { AudioResource, DiscordGatewayAdapterCreator } from '@discordjs/voice'
import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { LoggerService } from '../../core/logger/logger.service'
import { NoPlayerError } from '../../errors/no-player-error'
import { GolemMessage } from '../../messages/golem-message'
import { MessageInfo } from '../../messages/message-info'
import { waitUntil } from '../../utils/time-utils'
import { TrackAudioResourceMetadata, TrackType } from '../tracks'
import { Tracks } from '../tracks/tracks'
import { YoutubeService } from '../youtube/youtube.service'
import { MusicPlayer, MusicPlayerOptions } from './player'

type AudioResourceFactory = () =>
  | AudioResource<TrackAudioResourceMetadata>
  | Promise<AudioResource<TrackAudioResourceMetadata>>

export type AudioResourceDefinition = {
  factory: AudioResourceFactory
  track: Tracks
  userId: string
}

type PlayerLookup = [MessageInfo] | [string, string | undefined]

@Injectable()
export class PlayerService {
  private readonly _cache: Map<string, MusicPlayer> = new Map()

  constructor(
    private ref: ModuleRef,
    private log: LoggerService,
    private config: ConfigService,

    @Optional()
    private youtube: YoutubeService
  ) {
    this.log.setContext('PlayerService')
  }

  get cached(): Map<string, MusicPlayer> {
    return this._cache
  }

  /**
   * Should only be used to get the player for a guild if **no changes are going to be made to the player**.
   * @param guildId
   * @returns
   */
  forGuild(guildId: string): MusicPlayer | undefined {
    return this._cache.get(guildId)
  }

  for(info: MessageInfo): MusicPlayer | undefined
  for(guildId: string, channelId: string | undefined): MusicPlayer | undefined
  for(...args: PlayerLookup): MusicPlayer | undefined {
    const { guildId, channelId } = this.parseLookup(...args)

    this.log.debug(
      `fetching player for: guild="${guildId}" channel="${channelId}" `
    )

    const player = this._cache.get(guildId)

    if (!player) {
      return undefined
    }

    if (player.channelId !== channelId) {
      return undefined
    }

    return player
  }

  shuffle(info: MessageInfo): MusicPlayer
  shuffle(guildId: string, channelId: string): MusicPlayer
  shuffle(...args: PlayerLookup): MusicPlayer {
    const { guildId, channelId } = this.parseLookup(...args)

    const player = this.for(guildId, channelId)

    if (!player) {
      this.log.warn(`cannot run shuffle on guild with no player`)

      throw new NoPlayerError({
        message: 'Cannot shuffle in guild with no active player.',
        sourceCmd: 'shuffle',
      })
    }

    player.shuffle()

    return player
  }

  async create(
    message: GolemMessage
  ): Promise<MusicPlayer | undefined | 'ERR_NO_VOICE_CHANNEL'> {
    const debugServer = this.config.get('discord.debug')

    const hasDebugServer =
      !!debugServer.channelId &&
      !!debugServer.channelName &&
      !!debugServer.guildId &&
      !!debugServer.guildName

    if (
      (!hasDebugServer && !message.info.voiceChannel) ||
      !message.info.guild
    ) {
      this.log.warn(`create unable to create - no voice channel or guild`)

      return 'ERR_NO_VOICE_CHANNEL'
    }

    let opts: MusicPlayerOptions

    if (hasDebugServer) {
      this.log.info(`creating player using debug server`)
      opts = {
        adapterCreator: message.info.guild
          .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        channelId: debugServer.channelId,
        channelName: debugServer.channelName,
        guildId: debugServer.guildId,
        guildName: debugServer.guildName,
      }
    } else {
      opts = {
        adapterCreator: message.info.guild
          .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        channelId: message.info.voiceChannel!.id,
        channelName: message.info.voiceChannel!.name,
        guildId: message.info.guildId,
        guildName: message.info.guild.name,
      }
    }

    this.log.debug(
      `creating new player for name="${message.info.guild.name}" id="${message.info.guildId}" channelId="${message.info.voiceChannel?.id}",
      channelName="${message.info.voiceChannel?.name}"`
    )

    const player = new MusicPlayer(this.ref, opts)

    this._cache.set(message.info.guildId, player)

    await player.init()

    return player
  }

  async getOrCreate(
    message: GolemMessage
  ): Promise<
    MusicPlayer | undefined | 'ERR_ALREADY_ACTIVE' | 'ERR_NO_VOICE_CHANNEL'
  > {
    this.log.info(`[getOrCreate] player for ${message.info.guildId}`)
    const voiceChannelId = message.info.voiceChannel?.id
    const guildPlayer = this.forGuild(message.info.guildId)

    if (guildPlayer) {
      this.log.info(`found guild instance for ${message.info.guildId}`)

      await waitUntil(() => !!guildPlayer.voiceConnection, {
        maxTries: 5,
        waitTime: 250,
        timeoutHandler() {
          throw new Error(`A Voice Connection could not be established.`)
        },
      })

      // The bot is already in a channel
      if (guildPlayer.isConnected) {
        // The user is in the same channel as the bot
        if (guildPlayer.channelId === message.info.voiceChannel?.id) {
          return guildPlayer
        }

        return 'ERR_ALREADY_ACTIVE'
      }

      // Getting here means the guildPlayer is sitting idle and disconnected from voice

      // If we do not have a voice channel to update to, bail
      if (!voiceChannelId) {
        return undefined
      }

      guildPlayer.channelId = voiceChannelId

      return guildPlayer
    }

    this.log.info(`have to make new instance for ${message.info.guildId}`)

    return this.create(message)
  }

  async destroy(guildId: string): Promise<void> {
    const player = this.forGuild(guildId)

    if (player) {
      player.destroy()
    }
  }

  convertToAudioResource(
    track: Tracks,
    userId: string,
    opts: Record<'noCache', boolean> = {
      noCache: false,
    }
  ): AudioResourceDefinition {
    let audioResourceFactory: AudioResourceFactory

    switch (track.type) {
      case TrackType.Local:
        audioResourceFactory = () => track.toAudioResource()
        break
      case TrackType.Youtube:
        audioResourceFactory = () =>
          this.youtube.createAudioResource(track, opts)
        break
    }

    if (!audioResourceFactory) {
      throw new Error('Unsupported Track Type.')
    }

    return { factory: audioResourceFactory.bind(this), track, userId }
  }

  async play(
    message: GolemMessage,
    player: MusicPlayer,
    tracks: Tracks[] | Tracks,
    playType: 'next' | 'queue' = 'queue',
    noCache = false
  ): Promise<void> {
    const userId = message.info.userId
    const _tracks = Array.isArray(tracks) ? tracks : [tracks]

    // TODO this was reversed for some reason?
    for (const track of _tracks) {
      const audioResource = this.convertToAudioResource(track, userId, {
        noCache,
      })

      if (playType === 'next') {
        player.enqueue(audioResource, true)
      } else {
        player.enqueue(audioResource, false)
      }
    }
  }

  async playMany(
    message: GolemMessage,
    player: MusicPlayer,
    tracks: Tracks[]
  ): Promise<void> {
    const userId = message.info.userId
    const audioResources = tracks.map((track) =>
      this.convertToAudioResource(track, userId)
    )

    player.enqueueMany(userId, audioResources)
  }

  private parseLookup(...args: PlayerLookup): {
    guildId: string
    channelId: string | undefined
  } {
    return args.length === 1
      ? {
          guildId: args[0].guildId,
          channelId: args[0].voiceChannel?.id,
        }
      : {
          guildId: args[0],
          channelId: args[1],
        }
  }
}
