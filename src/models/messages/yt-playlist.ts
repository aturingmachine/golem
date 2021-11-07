import { EmbedFieldData, MessageEmbed, MessageOptions } from 'discord.js'
import { averageColor } from '../../utils/message-utils'
import { YoutubeTrack } from '../track'

export class YoutubePlaylistEmbed {
  static trackListCount = 5

  constructor(public options: MessageOptions) {}

  static async from(
    title: string,
    thumbnail: string | null,
    tracks: YoutubeTrack[]
  ): Promise<YoutubePlaylistEmbed> {
    const color = await averageColor(thumbnail || undefined)

    const firstTracks: EmbedFieldData[] = tracks
      .slice(0, YoutubePlaylistEmbed.trackListCount)
      .map((track) => ({ name: track.meta.title, value: track.meta.artist }))

    const embed = new MessageEmbed()
      .setTitle(`Queuing YouTube playlist`)
      .setDescription(title)
      .setColor(color.hex)
      .setFields(...firstTracks)

    if (thumbnail) {
      embed.setThumbnail(thumbnail)
    }

    if (tracks.length > YoutubePlaylistEmbed.trackListCount) {
      embed.setFooter(
        `and ${
          tracks.length - YoutubePlaylistEmbed.trackListCount
        } other tracks`
      )
    }

    return new YoutubePlaylistEmbed({ embeds: [embed] })
  }
}
