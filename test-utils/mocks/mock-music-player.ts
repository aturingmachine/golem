import { MockMusicPlayer } from './models/music-player'

jest.mock('../../src/player/music-player', () => ({
  MusicPlayer: MockMusicPlayer,
}))
