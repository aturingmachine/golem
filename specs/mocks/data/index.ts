import { createMockAlbum } from './mock-album'
import { createMockAudioResource } from './mock-audio-resource'
import { createMockLocalListing, createMockYTListing } from './mock-listing'
import { createMockLocalTrack } from './mock-track'

/**
 * Helper to get Mock Data of different shapes.
 */
export const Mocker = {
  Listing: {
    Local: createMockLocalListing,
    Youtube: createMockYTListing,
  },

  Track: {
    Local: createMockLocalTrack,
  },

  AudioResource: createMockAudioResource,

  Album: createMockAlbum,
}
