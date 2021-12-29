import gostop from '../../src/commands/implementations/gostop'
import { GolemMessage } from '../../src/messages/message-wrapper'
import { MockGolem } from '../../test-utils/mock-golem'
import { MockedMessage, MockMessage } from '../../test-utils/mock-message'
import {
  MockedMusicPlayer,
  MockMusicPlayer,
} from '../../test-utils/mock-music-player'

describe('gostop', () => {
  let mockMessage: MockedMessage
  let mockMusicPlayer: MockedMusicPlayer

  beforeEach(() => {
    try {
      mockMusicPlayer = MockMusicPlayer()
      MockGolem.playerCache.getOrCreate.mockReturnValue(mockMusicPlayer)
      mockMessage = MockMessage()
    } catch (error) {
      console.error(error)
      fail('error thrown in beforeEach' + error)
    }
  })

  it('should reply affirming and call stop on the player', async () => {
    await gostop.execute(mockMessage as unknown as GolemMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith('Clearing the queue!')
    expect(mockMusicPlayer.stop).toHaveBeenCalledTimes(1)
  })
})
