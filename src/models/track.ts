import { AudioResource, createAudioResource } from '@discordjs/voice'
import { IAudioMetadata } from 'music-metadata'
import { Listing } from './listing'

export class Track {
  public readonly listing!: Listing

  constructor(listing: Listing) {
    this.listing = listing
  }

  toAudioResource(): AudioResource {
    return createAudioResource(this.listing.path)
  }

  get searchString(): string {
    return `${this.listing.artist} - ${this.listing.album} - ${this.listing.title}`
  }

  static fromListing(listing: Listing): Track {
    return new Track(listing)
  }

  static async fromMeta(meta: IAudioMetadata, path: string): Promise<Track> {
    return new Track(await Listing.fromMeta(meta, path))
  }

  get debugString(): string {
    return `{artist=${this.listing.artist}; album=${this.listing.album}; track=${this.listing.title}}`
  }

  get shortName(): string {
    return `${this.listing.artist} - ${this.listing.title}`.slice(0, 90)
  }
}
