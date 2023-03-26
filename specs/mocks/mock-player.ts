import { AListing } from '../../src/music/local/listings/listings'
import {
  GolemTrackAudioResource,
  MusicPlayer,
} from '../../src/music/player/player'

export class MockPlayer {
  /**
   * Should Be GuildID
   */
  primaryKey = '211'

  /**
   * Should be ChannelId
   */
  secondaryKey = '528'

  isPlaying = false

  unpause = jest.fn()
  pause = jest.fn()
  peek = jest.fn()
  stop = jest.fn()
  skip = jest.fn().mockImplementation(() => {
    this.currentResource = this._nextResource
  })

  nowPlaying: AListing | undefined

  currentResource: GolemTrackAudioResource | undefined

  _nextResource: GolemTrackAudioResource | undefined

  _cast(): MusicPlayer {
    return this as unknown as MusicPlayer
  }

  _reset(): void {
    this.unpause.mockClear()
    this.pause.mockClear()
    this.peek.mockClear()
    this.skip.mockClear()
    this.stop.mockClear()
  }
}
