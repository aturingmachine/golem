import { DiscordGatewayAdapterCreator } from '@discordjs/voice'
import { Injectable } from '@nestjs/common'
import { Interaction, Message, Snowflake } from 'discord.js'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'
import { GolemMessage } from '../messages/message-wrapper'
import { MusicPlayer } from '../music/player/music-player'
import { GolemEvent, GolemEventEmitter } from './event-emitter'

@Injectable()
export class PlayerCache {
  /**
   * Map of GuildId - MusicPlayer
   */
  private data: Map<Snowflake, MusicPlayer>

  constructor(private logger: GolemLogger, private events: GolemEventEmitter) {
    this.data = new Map()
    this.logger.setContext(LogContexts.PlayerCache)
  }

  get(
    searchVal: [string, string | undefined] | Message | Interaction
  ): MusicPlayer | undefined {
    if (Array.isArray(searchVal)) {
      this.logger.silly(`string get player for: "${searchVal}"`)
      const target = this.data.get(searchVal[0].trim())

      if (!searchVal[1]) {
        return target
      }

      return target?.channelId === searchVal[1] ? target : undefined
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.logger.debug(`interaction get player for: ${searchVal.guild.id}`)
    return this.data.get(searchVal.guild.id)
  }

  getOrCreate(interaction: GolemMessage): MusicPlayer | undefined {
    this.logger.debug(
      `getting player for: guild=${interaction.info.guild?.name}; member=${interaction.info.member?.user.username}; voiceChannel=${interaction.info.voiceChannel?.id}; voiceChannelName=${interaction.info.voiceChannel?.name}`
    )

    if (!interaction.info.guild) {
      this.logger.warn('no guild - cannot get player')
      return undefined
    }

    if (!interaction.info.voiceChannel) {
      this.logger.warn('not in a valid voice channel')
      return undefined
    }

    const primaryKey = interaction.info.guildId
    const secondaryKey = interaction.info.voiceChannel.id

    if (
      !this.data.has(primaryKey) ||
      // Safe to non Null here
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.data.get(primaryKey)!.secondaryKey !== secondaryKey
    ) {
      this.logger.verbose(
        `no player for ${primaryKey} - ${secondaryKey} -- creating new`
      )
      const player = new MusicPlayer({
        channelId: interaction.info.voiceChannel.id,
        guildId: interaction.info.guildId,
        adapterCreator: interaction.info.guild
          .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        guildName: interaction.info.guild.name,
        channelName: interaction.info.voiceChannel.name,
      })

      this.data.set(primaryKey, player)
    }

    return this.data.get(primaryKey)
  }

  delete(primaryKey: Snowflake, secondaryKey?: string): void {
    this.logger.debug(`attempting delete for ${primaryKey} - ${secondaryKey}`)

    if (
      !this.data.has(primaryKey) ||
      // Safe to non Null here
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (secondaryKey && this.data.get(primaryKey)!.secondaryKey !== secondaryKey)
    ) {
      this.logger.warn(
        `attemped to delete nonexistent player for ${primaryKey}`
      )
      return
    }

    this.data.delete(primaryKey)

    this.events.trigger(GolemEvent.Connection, primaryKey)
  }

  disconnectAll(): void {
    this.data.forEach((player) => {
      this.events.trigger(GolemEvent.Connection, player.primaryKey)
      player.disconnect()
    })
  }

  keys(): IterableIterator<string> {
    return this.data.keys()
  }

  entries(): IterableIterator<[string, MusicPlayer]> {
    return this.data.entries()
  }
}
