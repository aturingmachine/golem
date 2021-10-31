import { MessageEmbed, MessageOptions } from 'discord.js'
import { averageColor } from '../../utils/message-utils'

export class YoutubePlaylistEmbed {
  constructor(public options: MessageOptions) {}

  static async from(
    title: string,
    thumbnail: string | null
  ): Promise<YoutubePlaylistEmbed> {
    const color = await averageColor(thumbnail || undefined)

    const embed = new MessageEmbed()
      .setTitle(`Queuing YouTube playlist`)
      .setDescription(title)
      .setColor(color.hex)

    if (thumbnail) {
      embed.setThumbnail(thumbnail)
    }

    return new YoutubePlaylistEmbed({ embeds: [embed] })
  }
}
