import { AListing, TrackListingInfo } from '../local/listings/listings'

export interface TrackAudioResourceMetadata {
  track: Track
  listing: AListing
}

export enum TrackType {
  Local = 'Local',
  Youtube = 'Youtube',
}

export abstract class Track {
  abstract readonly type: TrackType

  listing!: AListing

  constructor(public userId: string) {}

  // abstract toAudioResource():
  // | AudioResource<TrackAudioResourceMetadata>
  // | Promise<AudioResource<TrackAudioResourceMetadata>>

  abstract get metadata(): TrackListingInfo

  abstract get name(): string

  abstract onQueue(): void | Promise<void>

  abstract onPlay(): void | Promise<void>

  abstract onSkip(): void | Promise<void>
}
