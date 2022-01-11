import { MockLocalListing } from './listing'

export const MockMusicPlayer = jest.fn().mockImplementation(() => ({
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
}))

jest.mock('../../src/player/music-player', () => ({
  MusicPlayer: MockMusicPlayer,
}))
