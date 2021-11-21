import {
  AudioResource,
  demuxProbe,
  createAudioResource,
} from '@discordjs/voice'
import winston from 'winston'
import { raw as ytdl } from 'youtube-dl-exec'
import { getInfo } from 'ytdl-core'
import { TrackListingInfo } from '../../listing/listing'
import { Track, TrackAudioResourceMetadata } from '../../tracks'
import { GolemLogger, LogSources } from '../../utils/logger'
import { YoutubeListing } from './youtube-listing'

export class YoutubeTrack extends Track {
  private static readonly log: winston.Logger = GolemLogger.child({
    src: LogSources.YoutubeTrack,
  })

  constructor(
    userId: string,
    public url: string,
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
    return new Promise((resolve, reject) => {
      const process = ytdl(
        this.url,
        {
          o: '-',
          q: true,
          f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
          r: '100K',
        },
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )

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
          const metadata: TrackAudioResourceMetadata = {
            ...this.meta,
            track: this,
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

      process.once('error', onError)
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

    return new YoutubeTrack(userId, url, {
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
      artist: info.videoDetails.ownerChannelName,
      album: '-',
      albumArt: imgUrl,
    })
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
    return new YoutubeTrack(userId, listing.url, {
      album: '-',
      artist: listing.author,
      title: listing.title,
      duration: listing.duration,
      albumArt: listing.artworkUrl,
    })
  }
}
