import { AudioResource, createAudioResource } from '@discordjs/voice'
import winston from 'winston'
import { Analytics } from '../analytics'
import { LocalListing, TrackListingInfo } from '../listing/listing'
import { GolemLogger, LogSources } from '../utils/logger'
import { Track, TrackAudioResourceMetadata } from '.'

/**
 * A Track created from a Listing of a locally
 * stored audio file.
 */
export class LocalTrack extends Track {
  internalId!: string

  private static readonly log: winston.Logger = GolemLogger.child({
    src: LogSources.LocalTrack,
  })

  constructor(public readonly listing: LocalListing, userId: string) {
    super(userId)

    this.userId = userId
    this.listing = listing
  }

  toAudioResource(): AudioResource<TrackAudioResourceMetadata> {
    LocalTrack.log.verbose('converting to audio resource')
    return createAudioResource<TrackAudioResourceMetadata>(this.listing.path, {
      inlineVolume: true,
      metadata: {
        listing: this.listing,
        track: this,
      },
    })
  }

  get metadata(): TrackListingInfo {
    return {
      artist: this.listing.artist,
      albumName: this.listing.albumName,
      title: this.listing.title,
      duration: this.listing.duration,
      album: this.listing.album,
    }
  }

  get name(): string {
    return this.listing.shortName
  }

  onQueue(): void {
    Analytics.createPlayRecord(this.listing.listingId, this.userId, 'queue')
  }

  onPlay(): void {
    Analytics.createPlayRecord(this.listing.listingId, this.userId, 'play')
  }

  onSkip(): void {
    Analytics.createPlayRecord(this.listing.listingId, this.userId, 'skip')
  }

  static fromListing(listing: LocalListing, userId: string): LocalTrack {
    return new LocalTrack(listing, userId)
  }

  static fromListings(listings: LocalListing[], userId: string): LocalTrack[] {
    return listings.map((listing) => LocalTrack.fromListing(listing, userId))
  }
}
