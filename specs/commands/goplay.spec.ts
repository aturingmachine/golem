import goplay from '../../src/commands/implementations/goplay'
import { GolemMessage } from '../../src/messages/message-wrapper'
import { MockGolem } from '../../test-utils/mock-golem'
import { MockHandlers } from '../../test-utils/mock-handlers'
import { MockedMessage, MockMessage } from '../../test-utils/mock-message'
import {
  MockedMusicPlayer,
  MockMusicPlayer,
} from '../../test-utils/mock-music-player'

describe('goplay', () => {
  let mockMessage: MockedMessage
  let mockMusicPlayer: MockedMusicPlayer

  beforeEach(() => {
    mockMusicPlayer = MockMusicPlayer()
    MockGolem.playerCache.getOrCreate.mockReturnValue(mockMusicPlayer)
    mockMessage = MockMessage()
  })

  it('should pass the interaction to the play handler with playNext false', async () => {
    await goplay.execute(mockMessage as unknown as GolemMessage)

    expect(MockHandlers.Play.process).toHaveBeenCalledWith(mockMessage, {
      playNext: false,
    })
  })
})
