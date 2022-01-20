/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { MockAudioResource } from '../discordjs'
import { MockLocalListing } from './listing'

export const MockedMusicPlayer = () => ({
  currentResource: undefined as MockAudioResource | undefined,
  isPlaying: true,
  nowPlaying: MockLocalListing(),
  currentTrackRemaining: 10,
  stats: {
    count: 10,
    time: 180,
    hTime: '',
  },
  trackCount: 10,
  isDisconnected: false,
  isDestroyed: false,

  enqueue: jest.fn(),
  enqueueMany: jest.fn(),
  skip: jest.fn(),
  destroy: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  shuffle: jest.fn(),
})

export type MockedMusicPlayer = ReturnType<typeof MockedMusicPlayer>

export const MockMusicPlayer = jest.fn().mockImplementation(MockedMusicPlayer)
