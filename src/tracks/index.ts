import { AudioResource } from '@discordjs/voice'
import { AListing, TrackListingInfo } from '../listing/listing'

export interface TrackAudioResourceMetadata {
  // title: string
  // duration: number
  track: Track
  listing: AListing
  // internalId?: string
  // trackId?: string
  // artist?: string
  // album?: string
}

export abstract class Track {
  listing!: AListing

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
