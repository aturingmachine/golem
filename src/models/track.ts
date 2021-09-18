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
  track: Track
}

export class Track {
  internalId!: string
  userId!: string
  private readonly log: winston.Logger

  public readonly listing!: Listing

  constructor(listing: Listing, userId: string) {
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

  static fromListing(listing: Listing, userId: string): Track {
    return new Track(listing, userId)
  }

  onQueue(): void {
    console.log('TRACK QUEUED')
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'queue')
  }

  onPlay(): void {
    console.log('TRACK PLAYED')
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'play')
  }

  onSkip(): void {
    console.log('TRACK SKIPPED')
    Analytics.createPlayRecord(this.listing.trackId, this.userId, 'skip')
  }
}
