import {
  AudioResource,
  createAudioResource,
  demuxProbe,
} from '@discordjs/voice'
import winston from 'winston'
import ytdl, { getInfo } from 'ytdl-core'
import { Analytics } from '../analytics'
import { GolemLogger } from '../utils/logger'
import { Listing, TrackListingInfo } from './listing'

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

export class LocalTrack extends Track {
  internalId!: string

  private readonly log: winston.Logger

  constructor(public readonly listing: Listing, userId: string) {
    super(userId)

    this.log = GolemLogger.child({ src: 'track' })
    this.userId = userId
    this.listing = listing
  }

  toAudioResource(): AudioResource<TrackAudioResourceMetadata> {
    this.log.debug('converting to audio resource')
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

export class QueuedYoutubeTrack extends Track {
  public meta!: TrackListingInfo

  private audioResource!: AudioResource<TrackAudioResourceMetadata>

  constructor(userId: string, public url: string) {
    super(userId)
  }

  async toAudioResource(): Promise<AudioResource<TrackAudioResourceMetadata>> {
    await this.init()
    return this.audioResource
  }

  get metadata(): TrackListingInfo {
    return this.meta
  }

  get name(): string {
    return this.meta ? `${this.meta.artist} - ${this.meta.title}` : this.url
  }

  onQueue(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'queue')
  }

  async onPlay(): Promise<void> {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'play')
    await this.init()
  }

  onSkip(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'skip')
  }

  async init(): Promise<void> {
    const info = await getInfo(this.url)

    const _imgUrl = info.videoDetails.thumbnails.find(
      (thumbnail) => thumbnail.width > 300
    )?.url

    const imgUrl = _imgUrl?.slice(0, _imgUrl.indexOf('?'))

    this.meta = {
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
      artist: info.videoDetails.ownerChannelName,
      album: '-',
      albumArt: imgUrl,
    }

    const stream = ytdl(this.url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    const demux = await demuxProbe(stream)

    this.audioResource = createAudioResource<TrackAudioResourceMetadata>(
      demux.stream,
      {
        inputType: demux.type,
        metadata: { ...this.meta, track: this },
      }
    )
  }
}

export class YoutubeTrack extends Track {
  private audioResource!: AudioResource<TrackAudioResourceMetadata>

  constructor(
    userId: string,
    public url: string,
    public meta: TrackListingInfo
  ) {
    super(userId)
  }

  toAudioResource(): AudioResource<TrackAudioResourceMetadata> {
    return this.audioResource
  }

  get metadata(): TrackListingInfo {
    return this.meta
  }

  get name(): string {
    return `${this.meta.artist} - ${this.meta.title}`
  }

  onQueue(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'queue')
  }

  onPlay(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'play')
  }

  onSkip(): void {
    // Analytics.createPlayRecord(this.listing.trackId, this.userId, 'skip')
  }

  private async createAudioResource(): Promise<void> {
    const stream = ytdl(this.url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    const demux = await demuxProbe(stream)

    this.audioResource = createAudioResource<TrackAudioResourceMetadata>(
      demux.stream,
      {
        inputType: demux.type,
        metadata: { ...this.meta, track: this },
      }
    )
  }

  static async fromURL(url: string, userId = ''): Promise<YoutubeTrack> {
    const info = await getInfo(url)

    const _imgUrl = info.videoDetails.thumbnails.find(
      (thumbnail) => thumbnail.width > 300
    )?.url

    const imgUrl = _imgUrl?.slice(0, _imgUrl.indexOf('?'))

    const track = new YoutubeTrack(userId, url, {
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
      artist: info.videoDetails.ownerChannelName,
      album: '-',
      albumArt: imgUrl,
    })

    await track.createAudioResource()

    return track
  }
}
