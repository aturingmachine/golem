import { AudioResource, createAudioResource } from '@discordjs/voice'
import { IAudioMetadata } from 'music-metadata'
import winston from 'winston'
import { GolemLogger } from '../utils/logger'
import { Listing } from './listing'

export class Track {
  private readonly log: winston.Logger

  public readonly listing!: Listing

  constructor(listing: Listing) {
    this.log = GolemLogger.child({ src: `t-${listing.title.slice(0, 7)}` })
    this.listing = listing
  }

  toAudioResource(): AudioResource {
    this.log.debug('converting to audio resource')
    return createAudioResource(this.listing.path, {
      metadata: {
        track: {
          artist: this.listing.artist,
          album: this.listing.album,
          title: this.listing.title,
        },
      },
    })
  }

  isArtist(artist: string): boolean {
    return (
      artist.toLowerCase().trim() === this.listing.artist.toLowerCase().trim()
    )
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

  get longName(): string {
    return `${this.listing.artist} | ${this.listing.album} | ${this.listing.title}`
  }

  get shortName(): string {
    return `${this.listing.artist} - ${this.listing.title}`.slice(0, 90)
  }
}
