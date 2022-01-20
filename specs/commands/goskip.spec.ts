import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/mock-listing'
import '../../test-utils/mocks/mock-listing-embed'
import goskip from '../../src/commands/implementations/goskip'
import { MockAudioResource } from '../../test-utils/mocks/discordjs'
import {
  MockedListingEmbed,
  MockLocalListing,
} from '../../test-utils/mocks/models/listing'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goskip', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    MockedListingEmbed.send.mockClear()

    mockMessage = MockMessage()
    mockMessage.parsed.getDefault.mockReturnValue(10)
    mockMessage.reply.mockClear()

    mockMessage.player.currentResource = new MockAudioResource()
    mockMessage.player.nowPlaying = new MockLocalListing()
  })

  it('should reply that the player has no currentResource', async () => {
    mockMessage.player.currentResource = undefined

    await goskip.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith('No track to skip')
  })

  it('should reply that there is no track if there is nothing to skip', async () => {
    mockMessage.player.nowPlaying = undefined

    await goskip.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith('No track to skip')
  })

  it('should call skip with the parsed skip count', async () => {
    await goskip.execute(mockMessage._toWrapper())

    expect(mockMessage.player.skip).toHaveBeenCalledWith(10)
  })

  it('should reply using the ListingEmbed if there is another track', async () => {
    await goskip.execute(mockMessage._toWrapper())

    expect(MockedListingEmbed.send).toHaveBeenCalledWith('play', {
      content: 'Skipped!',
    })
  })

  it('should reply with the empty queue message if the queue is empty', async () => {
    mockMessage.player.nowPlaying = undefined
    mockMessage.player.currentResource = undefined

    await goskip.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith('No track to skip')
  })
})
