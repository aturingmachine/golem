import '../../test-utils/mocks/handlers/mock-handlers'
import goget from '../../src/commands/implementations/goget'
import { executeCommand } from '../../test-utils'
import { MockHandlers } from '../../test-utils/mocks/handlers/handlers'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goget', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = MockMessage()
  })

  it('should call the handler with values from the message', async () => {
    MockHandlers.GoGet.it.mockReturnValue('mock handler response')
    mockMessage.parsed.getString.mockReturnValue('gugudan')

    await executeCommand(goget, mockMessage)

    expect(MockHandlers.GoGet.it).toHaveBeenCalledWith({
      value: 'gugudan',
      guildId: mockMessage.info.guildId,
      message: mockMessage,
    })
    mockMessage.expectReply('mock handler response')
  })
})
