import goshuffle from '../../src/commands/implementations/goshuffle'
import { LoggerService } from '../../src/core/logger/logger.service'
import { NowPlayingReply } from '../../src/messages/replies/now-playing'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { Mocker } from '../mocks/data'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Shuffle', () => {
  let TestModule: TestCommandModule<typeof goshuffle>

  let playerService: jest.Mocked<PlayerService>

  let player: MockPlayer

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goshuffle, [
      LoggerService,
      PlayerService,
    ])

    playerService = TestModule.get(PlayerService)
  })

  beforeEach(() => {
    player = new MockPlayer()

    playerService.shuffle.mockClear()
    playerService.shuffle.mockReturnValue(player._cast())
  })

  it('should call shuffle and reply with a now playing card', async () => {
    const listing = Mocker.Listing.Local()
    player.nowPlaying = listing

    await TestModule.execute()

    expect(playerService.shuffle).toHaveBeenCalledWith(
      TestModule.message.info.guildId
    )
    expect(TestModule.message._added_replies).toContainEqual(
      await NowPlayingReply.fromListing(
        TestModule.message._cast(),
        listing,
        player._cast()
      )
    )
  })
})
