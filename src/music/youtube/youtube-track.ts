import {
  AudioResource,
  demuxProbe,
  createAudioResource,
} from '@discordjs/voice'
import winston from 'winston'
import { getInfo } from 'ytdl-core'
import { TrackListingInfo } from '../../listing/listing'
import { formatForLog } from '../../utils/debug-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { Track, TrackAudioResourceMetadata } from '../tracks'
import { YoutubeListing } from './youtube-listing'
import { youtubeDownload } from './ytdl'

export class YoutubeTrack extends Track {
  private static readonly log: winston.Logger = GolemLogger.child({
    src: LogSources.YoutubeTrack,
  })

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

  async toAudioResource(): Promise<AudioResource<TrackAudioResourceMetadata>> {
    YoutubeTrack.log.debug(`${this.url} converting to audio resource`)
    return new Promise((resolve, reject) => {
      const process = youtubeDownload(this.url)

      if (!process.stdout) {
        reject(new Error('No stdout'))
        return
      }

      const stream = process.stdout

      const onError = (error: Error) => {
        YoutubeTrack.log.error(error.message)
        if (!process.killed) {
          YoutubeTrack.log.debug(`process for track ${this.url} killed`)
          process.kill()
        }

        YoutubeTrack.log.debug(
          `process for track ${this.url} errored - resuming now`
        )
        stream.resume()
        reject(error)
      }

      process.once('spawn', async () => {
        try {
          YoutubeTrack.log.silly(`attempting to demux - ${this.listing.title}`)
          const metadata: TrackAudioResourceMetadata = {
            track: this,
            listing: this.listing,
          }

          const demux = await demuxProbe(stream)
          const audioResource = createAudioResource<TrackAudioResourceMetadata>(
            stream,
            {
              metadata,
              inputType: demux.type,
            }
          )

          resolve(audioResource)
        } catch (error) {
          YoutubeTrack.log.error(`demux error track=${this.url}`)
          YoutubeTrack.log.error(error)
          onError(error as Error)
        }
      })

      process.on('error', onError)
    })
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

    const _imgUrl = info.videoDetails.thumbnails.find(
      (thumbnail) => thumbnail.width > 300
    )?.url

    const imgUrl = _imgUrl?.slice(0, _imgUrl.indexOf('?'))

    const listing = new YoutubeListing(
      url,
      info.videoDetails.ownerChannelName,
      info.videoDetails.title,
      parseInt(info.videoDetails.lengthSeconds, 10),
      imgUrl
    )

    YoutubeTrack.log.silly(
      `created listing from ${url} - ${formatForLog(listing)}`
    )

    const track = YoutubeTrack.fromYoutubeListing(userId, listing)

    YoutubeTrack.log.silly(`created track - ${formatForLog(listing)}`)

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
    return new YoutubeTrack(userId, listing.url, listing, {
      album: listing.album,
      artist: listing.artist,
      title: listing.title,
      duration: listing.duration,
      albumName: '-',
    })
  }
}
