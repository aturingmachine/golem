import { Message } from 'discord.js'

export class MessageId {
  readonly userId: string
  readonly guildId: string
  readonly channelId: string

  constructor(readonly source: Message) {
    this.userId = source.author.id
    this.guildId = source.guild?.id || 'DM'
    this.channelId = source.channelId
  }
}
