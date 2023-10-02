import dargs from 'dargs'
import execa from 'execa'
import { ConfigurationService } from '../../core/configuration.service'
import { TrackListingInfo } from '../local/listings/listings'
import { YoutubeListing } from '../youtube/youtube-listing'
import { Track, TrackType } from '.'

export async function getYTInfo(url: string): Promise<any> {
  if (!ConfigurationService.resolved.youtube?.ytdlpPath) {
    throw new Error('No yt-dlp path')
  }

  try {
    const args = dargs({
      'dump-json': true,
    })
    console.log(`[getYTInfo] dumping info for "${url}"`)

    const res = await execa(
      ConfigurationService.resolved.youtube.ytdlpPath,
      [url, ...args],
      {
        encoding: 'utf-8',
      }
    )

    console.log(`[getYTInfo] info dumped "${url}"`)

    return JSON.parse(res.stdout.trim())
  } catch (error) {
    throw error
  }
}

export class YoutubeTrack extends Track {
  readonly type = TrackType.Youtube

  cache_handler?: { cancel: () => void }

  constructor(
    userId: string,
    public url: string,
    public listing: YoutubeListing,
    public meta: TrackListingInfo
  ) {
    super(userId)
  }

  get metadata(): TrackListingInfo {
    return this.meta
  }

  get name(): string {
    return this.meta ? `${this.meta.artist} - ${this.meta.title}` : this.url
  }

  // TODO handle analytics for youtube tracks
  onQueue(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'queue')
  }

  async onPlay(): Promise<void> {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'play')
    // await this.init()
  }

  onSkip(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'skip')
    if (this.cache_handler) {
      this.cache_handler.cancel()
    }
  }

  /**
   * Create a Track from a YouTube URL
   *
   * @param userId
   * @param url
   * @returns
   */
  static async fromUrl(userId: string, url: string): Promise<YoutubeTrack> {
    console.log(`[YoutubeTrack] creating track from url "${url}"`)
    const info = await getYTInfo(url)
    console.log(`[YoutubeTrack] got info for "${url}"`)

    const targetThumbnail: string =
      info.thumbnails
        .filter((thumb: any) => thumb.url.endsWith('.jpg'))
        .sort((a: any, b: any) => {
          return b.preference - a.preference
        })?.[0]?.url || info.thumbnail

    // const _imgUrl = info.videoDetails.thumbnails.find(
    //   (thumbnail) => thumbnail.width > 300
    // )?.url

    // const imgUrl = _imgUrl?.slice(0, _imgUrl.indexOf('?'))

    const listing = new YoutubeListing({
      url,
      author: info.channel,
      title: info.title,
      duration: parseInt(info.duration, 10),
      artworkUrl: targetThumbnail,
    })
    console.log(`[YoutubeTrack] generated listing for "${url}"`)

    // YoutubeTrack.log.silly(
    //   `created listing from ${url} - ${formatForLog(listing)}`
    // )

    const track = YoutubeTrack.fromYoutubeListing(userId, listing)
    console.log(`[YoutubeTrack] generated track for "${url}"`)

    // YoutubeTrack.log.silly(`created track - ${formatForLog(listing)}`)

    return track
  }

  /**
   * Create a Track from already processed YouTube data in the form
   * of a YouTubeListing
   *
   * @param userId
   * @param listing
   * @returns
   */
  static fromYoutubeListing(
    userId: string,
    listing: YoutubeListing
  ): YoutubeTrack {
    return new YoutubeTrack(userId, listing.options.url, listing, {
      artist: listing.artist,
      title: listing.title,
      duration: listing.duration,
      albumName: '-',
    })
  }
}
