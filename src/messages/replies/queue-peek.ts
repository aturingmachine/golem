import { EmbedFieldData, MessageEmbed } from 'discord.js'
import { GolemMessage } from '../message-wrapper'

export class QueuePeek {
  constructor(readonly message: GolemMessage) {}

  async send(content?: string): Promise<void> {
    await this.message.reply({ content, embeds: [this.embed] })
  }

  get embed(): MessageEmbed {
    const player = this.message.player

    if (!player) {
      return new MessageEmbed().setTitle('Not playing anything.')
    }

    const peekedTracks = player.peek()

    const fields = peekedTracks.map((track, index) => ({
      name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
      value: track.metadata.title,
    })) as EmbedFieldData[]

    return new MessageEmbed()
      .setTitle('Upcoming Tracks')
      .setDescription(`${player.trackCount} Queued Tracks`)
      .setFields(...fields)
  }
}
