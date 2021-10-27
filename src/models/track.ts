import { AudioResource, createAudioResource } from '@discordjs/voice'
import winston from 'winston'
import { Analytics } from '../analytics'
import { GolemLogger } from '../utils/logger'
import { Listing } from './listing'

export interface TrackAudioResourceMetadata {
  internalId: string
  trackId: string
  artist: string
  album: string
  title: string
  duration: number
  track: LocalTrack
}

export abstract class Track {
  constructor(public userId: string) {}

  abstract toAudioResource(): AudioResource

  abstract onQueue(): void

  abstract onPlay(): void

  abstract onSkip(): void
}

export class LocalTrack extends Track {
  internalId!: string

  private readonly log: winston.Logger

  public readonly listing!: Listing

  constructor(listing: Listing, userId: string) {
    super(userId)

    this.log = GolemLogger.child({ src: 'track' })
    this.userId = userId
    this.listing = listing
  }

  toAudioResource(): AudioResource {
    this.log.debug('converting to audio resource')
    return createAudioResource(this.listing.path, {
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
}

export class YoutubeTrack extends Track {
  constructor(userId: string, url: string) {
    super(userId)
  }

  toAudioResource(): AudioResource {
    // this.log.debug('converting to audio resource')
    // return createAudioResource(this.listing.path, {
    //   inlineVolume: true,
    //   metadata: {
    //     internalId: this.internalId,
    //     trackId: this.listing.trackId,
    //     artist: this.listing.artist,
    //     album: this.listing.album,
    //     title: this.listing.title,
    //     duration: this.listing.duration,
    //     track: this,
    //   },
    // })
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
}
