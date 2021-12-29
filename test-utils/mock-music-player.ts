import { MusicPlayer } from '../src/player/music-player'
import { createLocalListing } from './mock-listing'

// export type MockedMusicPlayer = {
//   isPlaying: boolean
//   nowPlaying: AListing | undefined
//   currentTrackRemaining: number
//   stats: { count: number; time: number; hTime: string }
//   trackCount: number
//   isDisconnected: boolean
//   isDestroyed: boolean
//   channelId: string

//   enqueue: jest.Mock<Promise<void>, [Track, boolean]>
//   enqueueMany: jest.Mock<Promise<void>, [string, Track[]]>
//   skip: jest.Mock<Promise<void>, [number]>
//   destroy: jest.Mock<void, [void]>
// }

jest.mock('../src/player/music-player')

export type MockedMusicPlayer = jest.Mocked<MusicPlayer>

export const MockMusicPlayer = (): jest.Mocked<MusicPlayer> => {
  // const player = new MusicPlayer({
  //   guildId: '',
  //   channelId: '',
  //   adapterCreator: (_methods) => ({
  //     sendPayload: jest.fn(),
  //     destroy: jest.fn(),
  //   }),
  // })

  // return deepMock(player)
  return {
    isPlaying: true,
    nowPlaying: createLocalListing(),
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
  } as unknown as jest.Mocked<MusicPlayer>
}
