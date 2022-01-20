import gostop from '../../src/commands/implementations/gostop'
import { GolemMessage } from '../../src/messages/message-wrapper'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('gostop', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  it('should reply affirming and call stop on the player', async () => {
    await gostop.execute(mockMessage as unknown as GolemMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith('Clearing the queue!')
    expect(mockMessage.player.stop).toHaveBeenCalledTimes(1)
  })
})
