import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/handlers/mock-handlers'
import goplaynext from '../../src/commands/implementations/goplaynext'
import { executeCommand } from '../../test-utils'
import { MockHandlers } from '../../test-utils/mocks/handlers/handlers'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goplaynext', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  it('should pass the interaction to the play handler with playNext false', async () => {
    await executeCommand(goplaynext, mockMessage)

    expect(MockHandlers.Play.process).toHaveBeenCalledWith(mockMessage, {
      playNext: true,
    })
  })
})
