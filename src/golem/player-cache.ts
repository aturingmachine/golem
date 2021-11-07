import { Snowflake } from 'discord-api-types'
import { Interaction, Message } from 'discord.js'
import { MessageInfo } from '../models/messages/message-info'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { guildIdFrom, memberFrom, userFrom } from '../utils/message-utils'

export class PlayerCache {
  private log = GolemLogger.child({ src: LogSources.PlayerCache })
  private data: Map<Snowflake, MusicPlayer>

  constructor() {
    this.data = new Map()
  }

  get(searchVal: string | Message | Interaction): MusicPlayer | undefined {
    if (typeof searchVal === 'string') {
      // Golem.log.silly(`string get player for: "${searchVal}"`)
      return this.data.get(searchVal.trim())
    }

    if (!searchVal.guild) {
      return undefined
    }

    // Golem.log.verbose(`interaction get player for: ${searchVal.guild.id}`)
    return this.data.get(searchVal.guild.id)
  }

  getOrCreate(interaction: Interaction | Message): MusicPlayer | undefined {
    const info = new MessageInfo(interaction)

    this.log.debug(
      `getting player for: guild=${info.guild?.name}; member=${info.member?.user.username}; voiceChannel=${info.voiceChannel?.id}`
    )

    if (!info.guild) {
      this.log.warn('no guild - cannot get player')
      return undefined
    }

    if (!info.voiceChannel) {
      this.log.warn('not in a valid voice channel')
      return undefined
    }

    if (!this.data.has(info.guildId)) {
      this.log.verbose(`no player for ${info.guildId} - creating new`)
      const player = new MusicPlayer({
        channelId: info.voiceChannel.id || '',
        guildId: info.guildId,
        adapterCreator: info.guild.voiceAdapterCreator,
      })

      this.data.set(info.guildId, player)
    }

    return this.data.get(info.guildId)
  }

  delete(key: Snowflake): void {
    this.data.delete(key)
  }

  disconnectAll(): void {
    this.data.forEach((player) => player.disconnect())
  }
}
