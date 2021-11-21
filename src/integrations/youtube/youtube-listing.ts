import ytpl from 'ytpl'
import { GolemLogger, LogSources } from '../../utils/logger'

export class YoutubeListing {
  private static log = GolemLogger.child({ src: LogSources.YoutubeListing })

  constructor(
    public author: string,
    public title: string,
    public url: string,
    public duration: number,
    public artworkUrl?: string
  ) {}

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
      item.author.name,
      item.title,
      cleanUrl,
      item.durationSec || 0,
      item.bestThumbnail.url || undefined
    )
  }
}
