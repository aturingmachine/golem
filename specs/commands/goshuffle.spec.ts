import '../../test-utils/mocks/mock-peek-embed'
import goshuffle from '../../src/commands/implementations/goshuffle'
import { executeCommand } from '../../test-utils'
import {
  MockedQueuePeek,
  MockQueuePeek,
} from '../../test-utils/mocks/models/listing'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goshuffle', () => {
  let mockMessage: MockedMessage
  let mockPeekEmbed: typeof MockedQueuePeek

  beforeEach(() => {
    mockMessage = new MockMessage()
    mockPeekEmbed = MockedQueuePeek

    MockQueuePeek.mockClear()
  })

  it('should shuffle the player and send a peek embed if there is a queue', async () => {
    MockQueuePeek.mockReturnValue(mockPeekEmbed)
    mockMessage.player.stats.count = 1

    await executeCommand(goshuffle, mockMessage)

    expect(mockMessage.player.shuffle).toHaveBeenCalled()
    expect(MockQueuePeek).toHaveBeenCalledWith(mockMessage)
    expect(mockPeekEmbed.send).toHaveBeenCalledTimes(1)
    expect(mockPeekEmbed.send).toHaveBeenCalledWith('Queue Shuffled!')
  })

  it('should reply that there is new queue if there is not one', async () => {
    mockMessage.player.stats.count = 0

    await executeCommand(goshuffle, mockMessage)

    expect(MockQueuePeek).not.toHaveBeenCalled()
    expect(mockMessage.reply).toHaveBeenCalledWith('No queue to shuffle.')
  })
})
