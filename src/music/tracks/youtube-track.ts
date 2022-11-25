import { getInfo } from 'ytdl-core'
import { TrackListingInfo } from '../local/listings/listings'
import { YoutubeListing } from '../youtube/youtube-listing'
import { Track, TrackType } from '.'

export class YoutubeTrack extends Track {
  readonly type = TrackType.Youtube

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
  }

  /**
   * Create a Track from a YouTube URL
   *
   * @param userId
   * @param url
   * @returns
   */
  static async fromUrl(userId: string, url: string): Promise<YoutubeTrack> {
    const info = await getInfo(url)

    // const _imgUrl = info.videoDetails.thumbnails.find(
    //   (thumbnail) => thumbnail.width > 300
    // )?.url

    // const imgUrl = _imgUrl?.slice(0, _imgUrl.indexOf('?'))

    const listing = new YoutubeListing({
      url,
      author: info.videoDetails.ownerChannelName,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
    })

    // YoutubeTrack.log.silly(
    //   `created listing from ${url} - ${formatForLog(listing)}`
    // )

    const track = YoutubeTrack.fromYoutubeListing(userId, listing)

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
