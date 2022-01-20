import { Snowflake } from 'discord-api-types'
import { Interaction, Message } from 'discord.js'
import { GolemMessage } from '../messages/message-wrapper'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { GolemEvent } from './event-emitter'
import { Golem } from '.'

export class PlayerCache {
  private log = GolemLogger.child({ src: LogSources.PlayerCache })

  private data: Map<Snowflake, MusicPlayer>

  constructor() {
    this.data = new Map()
  }

  get(searchVal: string | Message | Interaction): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      this.log.silly(`string get player for: "${searchVal}"`)
      return this.data.get(searchVal.trim())
    }

    if (!searchVal.guild) {
      return undefined
    }

    this.log.debug(`interaction get player for: ${searchVal.guild.id}`)
    return this.data.get(searchVal.guild.id)
  }

  getOrCreate(interaction: GolemMessage): MusicPlayer | undefined {
    this.log.debug(
      `getting player for: guild=${interaction.info.guild?.name}; member=${interaction.info.member?.user.username}; voiceChannel=${interaction.info.voiceChannel?.id}`
    )

    if (!interaction.info.guild) {
      this.log.warn('no guild - cannot get player')
      return undefined
    }

    if (!interaction.info.voiceChannel) {
      this.log.warn('not in a valid voice channel')
      return undefined
    }

    if (!this.data.has(interaction.info.guildId)) {
      this.log.verbose(
        `no player for ${interaction.info.guildId} - creating new`
      )
      const player = new MusicPlayer({
        channelId: interaction.info.voiceChannel.id || '',
        guildId: interaction.info.guildId,
        adapterCreator: interaction.info.guild.voiceAdapterCreator,
      })

      this.data.set(interaction.info.guildId, player)
    }

    return this.data.get(interaction.info.guildId)
  }

  delete(key: Snowflake): void {
    this.data.delete(key)
    Golem.events.trigger(GolemEvent.Connection, key)
  }

  disconnectAll(): void {
    this.data.forEach((player) => {
      Golem.events.trigger(
        GolemEvent.Connection,
        player.voiceConnection.joinConfig.guildId
      )
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
