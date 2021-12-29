import goskip from '../../src/commands/implementations/goskip'
import { MockGolem } from '../../test-utils/mock-golem'
import {
  createAudioResource,
  createLocalListing,
} from '../../test-utils/mock-listing'
import { MockedMessage, MockMessage } from '../../test-utils/mock-message'
import {
  MockedMusicPlayer,
  MockMusicPlayer,
} from '../../test-utils/mock-music-player'

describe('goskip', () => {
  let mockMessage: MockedMessage
  let mockMusicPlayer: MockedMusicPlayer

  beforeEach(() => {
    mockMusicPlayer = MockMusicPlayer()
    MockGolem.playerCache.getOrCreate.mockReturnValue(mockMusicPlayer)
    mockMessage = MockMessage()
    mockMessage.parsed.getDefault.mockReturnValue(10)
    mockMessage.reply.mockClear()

    mockMessage.player.currentResource = createAudioResource()
    mockMessage.player.nowPlaying = createLocalListing()
    // MockDatabase.findOne.mockResolvedValue({
    //   art: {
    //     200: { buffer: Buffer.from('200Art', 'utf-8') },
    //     400: { buffer: Buffer.from('400Art', 'utf-8') },
    //     1000: { buffer: Buffer.from('1000Art', 'utf-8') },
    //     original: { buffer: Buffer.from('originalArt', 'utf-8') },
    //   },
    // })
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

    expect(mockMessage.reply).toHaveBeenCalledWith('')
  })

  // it('should reply with the empty queue message if the queue is empty', async () => {})
})
