import { AListing } from '../../../src/music/local/listings/listings'
import { GolemTrackAudioResource } from '../../../src/music/player/player'
import { Track } from '../../../src/music/tracks'
import { createMockLocalListing } from './mock-listing'
import { createMockLocalTrack } from './mock-track'

const defaultAudioResource = (): GolemTrackAudioResource => {
  return {
    metadata: {
      track: createMockLocalTrack(),
      listing: createMockLocalListing(),
    },
  } as unknown as GolemTrackAudioResource
}

export function createMockAudioResource(
  record?: Partial<{
    track: Track
    listing: AListing
  }>
): GolemTrackAudioResource {
  if (!record) {
    return defaultAudioResource()
  }

  return {
    metadata: {
      ...defaultAudioResource().metadata,
      ...record,
    },
  } as unknown as GolemTrackAudioResource
}
