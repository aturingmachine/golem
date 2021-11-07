import {
  AudioResource,
  createAudioResource,
  demuxProbe,
} from '@discordjs/voice'
import winston from 'winston'
import { raw as ytdl } from 'youtube-dl-exec'
import { getInfo } from 'ytdl-core'
import { Analytics } from '../analytics'
import { GolemLogger, LogSources } from '../utils/logger'
import { Listing, TrackListingInfo } from './listing'
import { YoutubeListing } from './youtube'

export interface TrackAudioResourceMetadata {
  title: string
  duration: number
  track: Track
  internalId?: string
  trackId?: string
  artist?: string
  album?: string
}

export abstract class Track {
  constructor(public userId: string) {}

  abstract toAudioResource():
    | AudioResource<TrackAudioResourceMetadata>
    | Promise<AudioResource<TrackAudioResourceMetadata>>

  abstract get metadata(): TrackListingInfo

  abstract get name(): string

  abstract onQueue(): void | Promise<void>

  abstract onPlay(): void | Promise<void>

  abstract onSkip(): void | Promise<void>
}

/**
 * A Track created from a Listing of a locally
 * stored audio file.
 */
export class LocalTrack extends Track {
  internalId!: string

  private static readonly log: winston.Logger = GolemLogger.child({
    src: LogSources.LocalTrack,
  })

  constructor(public readonly listing: Listing, userId: string) {
    super(userId)

    this.userId = userId
    this.listing = listing
  }

  toAudioResource(): AudioResource<TrackAudioResourceMetadata> {
    LocalTrack.log.verbose('converting to audio resource')
    return createAudioResource<TrackAudioResourceMetadata>(this.listing.path, {
      inlineVolume: true,
      metadata: {
        internalId: this.internalId,
        trackId: this.listing.trackId,
        artist: this.listing.artist,
        album: this.listing.album,
        title: this.listing.title,
        duration: this.listing.duration,
        track: this,
      },
    })
  }

  get metadata(): TrackListingInfo {
    return {
      artist: this.listing.artist,
      album: this.listing.album,
      title: this.listing.title,
      duration: this.listing.duration,
      albumArt: this.listing.albumArt,
    }
  }

  get name(): string {
    return this.listing.shortName
  }

  onQueue(): void {
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'queue')
  }

  onPlay(): void {
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'play')
  }

  onSkip(): void {
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'skip')
  }

  static fromListing(listing: Listing, userId: string): LocalTrack {
    return new LocalTrack(listing, userId)
  }

  static fromListings(listings: Listing[], userId: string): LocalTrack[] {
    return listings.map((listing) => LocalTrack.fromListing(listing, userId))
  }
}

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
