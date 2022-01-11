import { addStaticMocks } from '../mocks'
import { MockAudioResource } from './discordjs'
import { MockLocalListing } from './listing'

export const MockLocalTrack = jest.fn().mockImplementation(() => ({
  internalId: '',
  listing: MockLocalListing(),
  userId: 'ksj',
  toAudioResource: jest.fn().mockImplementation(() => MockAudioResource()),
  metadata: {},
  name: '',
  onQueue: jest.fn(),
  onPlay: jest.fn(),
  onSkip: jest.fn(),
}))

addStaticMocks(MockLocalTrack, 'fromListing', 'fromListings')
