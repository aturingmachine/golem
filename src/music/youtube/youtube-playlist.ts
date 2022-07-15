import { EmbedFieldData, MessageEmbed, MessageOptions } from 'discord.js'
import { ImageUtils } from '../../utils/image-utils'
import { MusicPlayer } from '../player/music-player'
import { YoutubeListing } from './youtube-listing'
import { YoutubeTrack } from './youtube-track'

export interface YoutubePlaylistListing {
  title: string
  listings: YoutubeListing[]
  thumbnail: string | null
}

export class YoutubePlaylistEmbed {
  static trackListCount = 5

  constructor(public options: MessageOptions) {}

  static async from(
    title: string,
    thumbnail: string | null,
    tracks: YoutubeTrack[]
  ): Promise<YoutubePlaylistEmbed> {
    const color = await ImageUtils.averageColor(thumbnail || undefined)

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

export class YoutubePlaylistListing {
  public userId!: string

  constructor(
    public title: string,
    public listings: YoutubeListing[],
    public thumbnail: string | null
  ) {}

  get tracks(): YoutubeTrack[] {
    return this.listings.map((listing) =>
      YoutubeTrack.fromYoutubeListing(this.userId, listing)
    )
  }

  get embed(): Promise<YoutubePlaylistEmbed> {
    return YoutubePlaylistEmbed.from(this.title, this.thumbnail, this.tracks)
  }

  play(userId: string, player: MusicPlayer): Promise<void> {
    // TODO we should make this easier to work with, setting userId on the
    // instance feels really fuckin bad
    this.userId = userId
    return player.enqueueMany(userId, this.tracks)
  }
}
