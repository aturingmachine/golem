import { MockLocalListing } from './listing'
import { MockLocalTrack } from './track'

export const MockAudioResource = jest.fn().mockImplementation(() => ({
  started: true,
  playbackDuration: 828,
  read: jest.fn(),
  metadata: {
    listing: MockLocalListing(),
    track: MockLocalTrack(),
  },
}))

jest.mock('@discordjs/voice', () => ({
  AudioResource: MockAudioResource,
  createAudioResource: jest.fn(() => MockAudioResource()),
}))
