import ytpl from 'ytpl'

export interface YoutubePlaylistListing {
  title: string
  listings: YoutubeListing[]
  thumbnail: string | null
}

export class YoutubeListing {
  constructor(
    public author: string,
    public title: string,
    public url: string,
    public duration: number,
    public artworkUrl?: string
  ) {}

  static fromPlaylistItem(item: ytpl.Item): YoutubeListing {
    return new YoutubeListing(
      item.author.name,
      item.title,
      item.url,
      item.durationSec || 0,
      item.bestThumbnail.url || undefined
    )
  }
}
