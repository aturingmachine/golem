import { DiscordGatewayAdapterCreator } from '@discordjs/voice'
import { Interaction, Message, Snowflake } from 'discord.js'
import { GolemMessage } from '../messages/message-wrapper'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { GolemEvent } from './event-emitter'
import { Golem } from '.'

export class PlayerCache {
  private log = GolemLogger.child({ src: LogSources.PlayerCache })

  /**
   * Map of GuildId - MusicPlayer
   */
  private data: Map<Snowflake, MusicPlayer>

  constructor() {
    this.data = new Map()
  }

  get(
    searchVal: [string, string | undefined] | Message | Interaction
  ): MusicPlayer | undefined {
    if (Array.isArray(searchVal)) {
      this.log.silly(`string get player for: "${searchVal}"`)
      const target = this.data.get(searchVal[0].trim())

      if (!searchVal[1]) {
        return target
      }

      return target?.channelId === searchVal[1] ? target : undefined
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.log.debug(`interaction get player for: ${searchVal.guild.id}`)
    return this.data.get(searchVal.guild.id)
  }

  getOrCreate(interaction: GolemMessage): MusicPlayer | undefined {
    this.log.debug(
      `getting player for: guild=${interaction.info.guild?.name}; member=${interaction.info.member?.user.username}; voiceChannel=${interaction.info.voiceChannel?.id}; voiceChannelName=${interaction.info.voiceChannel?.name}`
    )

    if (!interaction.info.guild) {
      this.log.warn('no guild - cannot get player')
      return undefined
    }

    if (!interaction.info.voiceChannel) {
      this.log.warn('not in a valid voice channel')
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
      this.log.verbose(
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
    this.log.debug(`attempting delete for ${primaryKey} - ${secondaryKey}`)

    if (
      !this.data.has(primaryKey) ||
      // Safe to non Null here
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (secondaryKey && this.data.get(primaryKey)!.secondaryKey !== secondaryKey)
    ) {
      this.log.warn(`attemped to delete nonexistent player for ${primaryKey}`)
      return
    }

    this.data.delete(primaryKey)

    Golem.events.trigger(GolemEvent.Connection, primaryKey)
  }

  disconnectAll(): void {
    this.data.forEach((player) => {
      Golem.events.trigger(GolemEvent.Connection, player.primaryKey)
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
