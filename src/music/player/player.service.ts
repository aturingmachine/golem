import { DiscordGatewayAdapterCreator } from '@discordjs/voice'
import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { MusicPlayer } from './player'

@Injectable()
export class PlayerService {
  private readonly _cache: Map<string, MusicPlayer> = new Map()

  constructor(private ref: ModuleRef, private log: LoggerService) {}

  for(guildId: string): MusicPlayer | undefined {
    return this._cache.get(guildId)
  }

  async create(message: GolemMessage): Promise<MusicPlayer | undefined> {
    if (!message.info.voiceChannel || !message.info.guild) {
      this.log.warn(`create unable to create - no voice channel or guild`)
      return
    }

    const player = new MusicPlayer(this.ref, {
      adapterCreator: message.info.guild
        .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
      channelId: message.info.voiceChannel.id,
      channelName: message.info.voiceChannel.name,
      guildId: message.info.guildId,
      guildName: message.info.guild.name,
    })

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
}