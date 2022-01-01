import { URL } from 'url'
import { EmbedFieldData } from 'discord.js'
import ytpl from 'ytpl'
import { AListing, ListingEmbedData } from '../../listing/listing'
import { GolemLogger, LogSources } from '../../utils/logger'
import { averageColor, embedFieldSpacer } from '../../utils/message-utils'
import { humanReadableDuration } from '../../utils/time-utils'

export class YoutubeListing extends AListing {
  private static log = GolemLogger.child({ src: LogSources.YoutubeListing })

  declare albumArt: string

  constructor(
    public url: string,
    author: string,
    title: string,
    duration: number,
    artworkUrl?: string
  ) {
    const parsedUrl = new URL(url)
    const listingId = parsedUrl.searchParams.get('v')
    super(listingId || url, title, duration, author, '', artworkUrl)
  }

  async toEmbed(): Promise<ListingEmbedData> {
    const duration = humanReadableDuration(this.duration)
    const color = await averageColor(this.albumArt)

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
    YoutubeListing.log
      .debug(`creating YoutubeListing from item values: author=${
      item.author.name
    }; title=${item.title}; url=${item.url}; duration=${
      item.durationSec || 0
    }; artworkUrl=${item.bestThumbnail.url || undefined};
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
