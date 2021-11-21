import ytpl from 'ytpl'
import { AListing } from '../../listing/listing'
import { GolemLogger, LogSources } from '../../utils/logger'

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
    super(title, duration, author, '', artworkUrl)
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
