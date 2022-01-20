import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/handlers/mock-handlers'
import goplay from '../../src/commands/implementations/goplay'
import { GolemMessage } from '../../src/messages/message-wrapper'
import { MockHandlers } from '../../test-utils/mocks/handlers/handlers'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goplay', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  it('should pass the interaction to the play handler with playNext false', async () => {
    await goplay.execute(mockMessage as unknown as GolemMessage)

    expect(MockHandlers.Play.process).toHaveBeenCalledWith(mockMessage, {
      playNext: false,
    })
  })
})
