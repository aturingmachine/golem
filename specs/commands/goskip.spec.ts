import goskip from '../../src/commands/implementations/goskip'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
import { MessageBuilderService } from '../../src/messages/message-builder.service'
import { Replies } from '../../src/messages/replies/replies'
import { LocalListing } from '../../src/music/local/listings/listings'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { Mocker } from '../mocks/data'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Skip', () => {
  let TestModule: TestCommandModule<typeof goskip>

  let playerService: jest.Mocked<PlayerService>
  let builder: jest.Mocked<MessageBuilderService>

  let player: MockPlayer

  let listing: LocalListing
  let listing2: LocalListing

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goskip, [
      LoggerService,
      PlayerService,
      MessageBuilderService,
    ])

    playerService = TestModule.get(PlayerService)
    builder = TestModule.get(MessageBuilderService)
  })

  beforeEach(() => {
    listing = Mocker.Listing.Local()
    listing2 = Mocker.Listing.Local({ listingId: 'listing-2' })
    player = new MockPlayer()

    player._reset()
    player.nowPlaying = listing
    player.currentResource = Mocker.AudioResource({
      listing,
    })
    player._nextResource = Mocker.AudioResource({
      listing: listing2,
    })

    playerService.for.mockReturnValue(player._cast())
  })

  it('should throw if there is no player', async () => {
    playerService.for.mockReturnValue(undefined)

    await expect(() => TestModule.execute()).rejects.toThrow(
      Errors.NoPlayer({
        message: `unable to create player for guild: Running on Empty channel: Cigar Lounge`,
        sourceCmd: 'skip',
      })
    )

    expect(player.skip).not.toHaveBeenCalled()
  })

  it('should throw if there is no track being played', async () => {
    player.nowPlaying = undefined

    await expect(() => TestModule.execute()).rejects.toThrow(
      Errors.NoPlayer({
        message: `No track to skip.`,
        sourceCmd: 'skip',
      })
    )
  })

  it('should reply with the new now playing card after skip', async () => {
    const reply = Replies.Raw('Now Playing Builder Reply')
    TestModule.source._mockedParams({ 'skip-count': 5 })
    builder.nowPlaying.mockResolvedValue(reply)

    await TestModule.execute()

    expect(player.skip).toHaveBeenCalledWith(5)
    expect(TestModule.message.addReply).toHaveBeenCalledWith(reply)
  })

  it('should reply that the queue is empty if the last track has been skipped', async () => {
    const reply = Replies.Raw('Track Skipped! The queue is now empty.')
    TestModule.source._mockedParams({ 'skip-count': 5 })
    builder.nowPlaying.mockResolvedValue(reply)
    player._nextResource = undefined

    await TestModule.execute()

    expect(player.skip).toHaveBeenCalledWith(5)
    expect(TestModule.message.addReply).toHaveBeenCalledWith(reply)
  })
})
