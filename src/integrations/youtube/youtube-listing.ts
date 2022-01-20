import { URL } from 'url'
import { EmbedFieldData } from 'discord.js'
import ytpl from 'ytpl'
import { Album } from '../../listing/album'
import { AListing, ListingEmbedData } from '../../listing/listing'
import { formatForLog } from '../../utils/debug-utils'
import { ImageUtils } from '../../utils/image-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { embedFieldSpacer } from '../../utils/message-utils'
import { humanReadableDuration } from '../../utils/time-utils'

export class YoutubeAlbum extends Album {
  readonly albumId: string
  readonly art: string

  constructor(url: string, thumbnail: string) {
    super()

    this.albumId = url
    this.art = thumbnail
  }

  getArt(_size: 200 | 400 | 1000 | 'original' = 'original'): string {
    return this.art
  }
}

export class YoutubeListing extends AListing {
  private static log = GolemLogger.child({ src: LogSources.YoutubeListing })

  declare album: YoutubeAlbum

  constructor(
    public url: string,
    author: string,
    title: string,
    duration: number,
    artworkUrl?: string
  ) {
    const album = new YoutubeAlbum(url, artworkUrl || '')
    const parsedUrl = new URL(url)
    const listingId = parsedUrl.searchParams.get('v')

    super(listingId || url, title, duration, author, '', album)
  }

  async toEmbed(): Promise<ListingEmbedData> {
    const duration = humanReadableDuration(this.duration)
    const color = await ImageUtils.averageColor(this.album.getArt('original'))

    const fields: EmbedFieldData[] = [
      {
        name: 'Artist',
        value: this.artist,
      },
      {
        name: 'Album',
        value: '-',
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Duration',
        value: duration,
        inline: true,
      },
      {
        name: 'Track',
        value: this.title,
        inline: true,
      },
      embedFieldSpacer,
    ]

    return { fields, color }
  }

  static fromPlaylistItem(item: ytpl.Item): YoutubeListing {
    YoutubeListing.log.debug(`creating YoutubeListing from ${formatForLog({
      name: item.author.name,
      title: item.title,
      url: item.url,
      duration: item.durationSec,
      artworkUrl: item.bestThumbnail.url,
    })}
    `)

    const cleanUrl = `${item.url.split('?')[0]}?${item.url
      .split('?')[1]
      .split('&')
      .map((q) => q.split('='))
      .filter(([key, _value]) => key === 'v')
      .map((q) => q.join('='))
      .join('')}`

    return new YoutubeListing(
      cleanUrl,
      item.author.name,
      item.title,
      item.durationSec || 0,
      item.bestThumbnail.url || undefined
    )
  }
}
