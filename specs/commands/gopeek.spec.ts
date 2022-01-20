import '../../test-utils/mocks/mock-peek-embed'
import gopeek from '../../src/commands/implementations/gopeek'
import { executeCommand } from '../../test-utils'
import {
  MockedQueuePeek,
  MockQueuePeek,
} from '../../test-utils/mocks/models/listing'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('gopeek', () => {
  let mockMessage: MockedMessage
  let mockPeekEmbed: typeof MockedQueuePeek

  beforeEach(() => {
    mockMessage = new MockMessage()
    mockPeekEmbed = MockedQueuePeek
  })

  it('should reply with the peek embed', async () => {
    MockQueuePeek.mockReturnValue(mockPeekEmbed)

    await executeCommand(gopeek, mockMessage)

    expect(MockQueuePeek).toHaveBeenCalledWith(mockMessage)
    expect(mockPeekEmbed.send).toHaveBeenCalledTimes(1)
  })
})
