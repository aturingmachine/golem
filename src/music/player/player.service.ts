import { AudioResource, DiscordGatewayAdapterCreator } from '@discordjs/voice'
import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { TrackAudioResourceMetadata, TrackType } from '../tracks'
import { Tracks } from '../tracks/tracks'
import { YoutubeService } from '../youtube/youtube.service'
import { MusicPlayer } from './player'

type AudioResourceFactory = () =>
  | AudioResource<TrackAudioResourceMetadata>
  | Promise<AudioResource<TrackAudioResourceMetadata>>

export type AudioResourceDefinition = {
  factory: AudioResourceFactory
  track: Tracks
  userId: string
}

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

  for(guildId: string): MusicPlayer | undefined {
    this.log.debug(
      `fetching player for: ${guildId}; current cache: ${Object.entries(
        this._cache
      )}`
    )
    return this._cache.get(guildId)
  }

  async create(message: GolemMessage): Promise<MusicPlayer | undefined> {
    const debugServer = this.config.get('discord.debug')

    if ((!debugServer && !message.info.voiceChannel) || !message.info.guild) {
      this.log.warn(`create unable to create - no voice channel or guild`)
      return
    }

    const opts = debugServer
      ? {
          adapterCreator: message.info.guild
            .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
          channelId: debugServer.channelId,
          channelName: debugServer.channelName,
          guildId: debugServer.guildId,
          guildName: debugServer.guildName,
        }
      : {
          adapterCreator: message.info.guild
            .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
          channelId: message.info.voiceChannel?.id,
          channelName: message.info.voiceChannel?.name,
          guildId: message.info.guildId,
          guildName: message.info.guild.name,
        }

    const player = new MusicPlayer(this.ref, opts)

    this._cache.set(message.info.guildId, player)

    await player.init()

    return player
  }

  async getOrCreate(message: GolemMessage): Promise<MusicPlayer | undefined> {
    this.log.info(`getOrCreate player for ${message.info.guildId}`)

    if (this._cache.has(message.info.guildId)) {
      this.log.info(`found instance for ${message.info.guildId}`)
      return this.for(message.info.guildId)
    }

    this.log.info(`have to make new instance for ${message.info.guildId}`)

    return this.create(message)
  }

  convertToAudioResource(
    track: Tracks,
    userId: string
  ): AudioResourceDefinition {
    let audioResourceFactory: AudioResourceFactory

    switch (track.type) {
      case TrackType.Local:
        audioResourceFactory = () => track.toAudioResource()
        break
      case TrackType.Youtube:
        audioResourceFactory = () => this.youtube.createAudioResource(track)
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
    playType: 'next' | 'queue' = 'queue'
  ): Promise<void> {
    const userId = message.info.userId

    for (const track of (Array.isArray(tracks) ? tracks : [tracks]).reverse()) {
      const audioResource = this.convertToAudioResource(track, userId)

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
}
