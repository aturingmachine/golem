import { EmbedBuilder, APIEmbedField } from 'discord.js'
import { Track } from '../../music/tracks'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class QueueReply extends BaseReply {
  readonly type = ReplyType.Queue
  readonly isUnique = true

  constructor(readonly tracks: Track[] = []) {
    const length = tracks.length

    console.log(length, 'tracks queued?')

    const fields = tracks.slice(0, 10).map((track, index) => ({
      name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
      value: `${track.metadata.title} - ${track.metadata.artist}`,
    })) as APIEmbedField[]

    console.log(fields)

    const embed = new EmbedBuilder()
      .setTitle(`${length} Tracks queued:`)
      .setFields(...fields)

    if (length > fields.length) {
      console.log('Not Setting Footer.')
      embed.setFooter({ text: `+ ${length - fields.length} more` })
    }

    super({ embeds: [embed.data] })
  }
}
