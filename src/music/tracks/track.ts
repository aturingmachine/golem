import { AudioResource, createAudioResource } from '@discordjs/voice'
import { LocalListing, TrackListingInfo } from '../listings/listings'
import { Track, TrackAudioResourceMetadata } from '.'

/**
 * A Track created from a Listing of a locally
 * stored audio file.
 */
export class LocalTrack extends Track {
  internalId!: string

  constructor(public readonly listing: LocalListing, userId: string) {
    super(userId)

    this.userId = userId
    this.listing = listing
  }

  toAudioResource(): AudioResource<TrackAudioResourceMetadata> {
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
      // album: this.listing.album,
    }
  }

  get name(): string {
    return this.listing.shortName
  }

  onQueue(): void {
    // Analytics.createPlayRecord(this.listing.listingId, this.userId, 'queue')
  }

  onPlay(): void {
    // Analytics.createPlayRecord(this.listing.listingId, this.userId, 'play')
  }

  onSkip(): void {
    // Analytics.createPlayRecord(this.listing.listingId, this.userId, 'skip')
  }

  static fromListing(listing: LocalListing, userId: string): LocalTrack {
    return new LocalTrack(listing, userId)
  }

  static fromListings(listings: LocalListing[], userId: string): LocalTrack[] {
    return listings.map((listing) => LocalTrack.fromListing(listing, userId))
  }
}
