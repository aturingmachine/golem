import '../../test-utils/mocks/mock-message'
import gopause from '../../src/commands/implementations/gopause'
import { executeCommand } from '../../test-utils'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('gopause', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  it('should pause the player and reply affirmatively', async () => {
    await executeCommand(gopause, mockMessage)

    expect(mockMessage.player.pause).toHaveBeenCalled()
  })
})
