import { URL } from 'url'
import { APIEmbedField } from 'discord.js'
import ytpl from 'ytpl'
import { embedFieldSpacer } from '../../constants'
import { ImageUtils } from '../../utils/image-utils'
import { LogUtils } from '../../utils/log-utils'
import { humanReadableDuration } from '../../utils/time-utils'
import { AAlbum } from '../local/listings/album'
import { AListing, ListingEmbedData } from '../local/listings/listings'

export class YoutubeAlbum extends AAlbum {
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

  get attachmentUrl(): string {
    return this.art
  }
}

export class YoutubeListing extends AListing {
  readonly listingId!: string
  readonly title!: string
  readonly duration!: number
  readonly artist!: string
  readonly albumName!: string

  declare album: YoutubeAlbum

  constructor(
    public readonly options: {
      url: string
      author: string
      title: string
      duration: number
      artworkUrl?: string
    }
  ) {
    super()

    console.log('>>>>', options.artworkUrl)

    const album = new YoutubeAlbum(options.url, options.artworkUrl || '')
    const parsedUrl = new URL(options.url)
    const listingId =
      parsedUrl.searchParams.get('v') || parsedUrl.pathname.replace('/', '')

    this.listingId = listingId || options.url
    this.title = options.title
    this.duration = options.duration
    this.artist = options.author
    this.albumName = album.albumId
    this.album = album
  }

  get albumArtUrl(): string {
    return this.album.attachmentUrl
  }

  async toEmbed(): Promise<ListingEmbedData> {
    const duration = humanReadableDuration(this.duration)
    const color = await ImageUtils.averageColor(this.album.getArt('original'))

    const fields: APIEmbedField[] = [
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
    const cleanUrl = `${item.url.split('?')[0]}?${item.url
      .split('?')[1]
      .split('&')
      .map((q) => q.split('='))
      .filter(([key, _value]) => key === 'v')
      .map((q) => q.join('='))
      .join('')}`

    return new YoutubeListing({
      url: cleanUrl,
      author: item.author.name,
      title: item.title,
      duration: item.durationSec || 0,
    })
  }
}
