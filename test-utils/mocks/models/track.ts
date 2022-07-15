import { LocalTrack } from '../../../src/music/tracks/track'
import { MockAudioResource } from '../discordjs'
import { MockedLocalListing, MockLocalListing } from './listing'

export type MockLocalTrack = {
  internalId: string
  listing: MockedLocalListing
  userId: 'ksj'
  toAudioResource: () => MockAudioResource
  metadata: Record<string, unknown>
  name: ''
  onQueue: jest.Mock
  onPlay: jest.Mock
  onSkip: jest.Mock
  _toTrack(): LocalTrack
}

export const MockLocalTrack: jest.Mock<MockLocalTrack> & {
  fromListing: jest.Mock
  fromListings: jest.Mock
} = Object.assign(
  jest.fn().mockImplementation((id?: string) => ({
    internalId: id || 'internal-id',
    listing: MockLocalListing(),
    userId: 'ksj',
    toAudioResource: jest.fn().mockImplementation(() => MockAudioResource()),
    metadata: {},
    name: '',
    onQueue: jest.fn(),
    onPlay: jest.fn(),
    onSkip: jest.fn(),
    _toTrack(): LocalTrack {
      return this as LocalTrack
    },
  })),
  { fromListing: jest.fn() },
  { fromListings: jest.fn() }
)
