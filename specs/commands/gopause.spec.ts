import gopause from '../../src/commands/implementations/gopause'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
// import { MessageBuilderService } from '../../src/messages/message-builder.service'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Pause', () => {
  let TestModule: TestCommandModule<typeof gopause>

  // let builder: jest.Mocked<MessageBuilderService>
  let playerService: jest.Mocked<PlayerService>

  let player: MockPlayer

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(gopause, [
      LoggerService,
      // MessageBuilderService,
      PlayerService,
    ])

    // builder = TestModule.ref.get(MessageBuilderService)
    playerService = TestModule.ref.get(PlayerService)
  })

  beforeEach(() => {
    player = new MockPlayer()
  })

  it('should throw an error if there is no player', async () => {
    playerService.for.mockReturnValue(undefined)

    await expect(() => TestModule.execute()).rejects.toThrow(
      Errors.NoPlayer({
        message: 'Cannot pause, no active player in server.',
        sourceCmd: 'pause',
      })
    )
  })

  it('should unpause if there is a player', async () => {
    playerService.for.mockReturnValue(player._cast())

    await TestModule.execute()

    expect(player.pause).toHaveBeenCalledTimes(1)
    expect(TestModule.message.addReply).toHaveBeenCalledTimes(1)
  })
})
