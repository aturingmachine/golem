import gopeek from '../../src/commands/implementations/gopeek'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Peek', () => {
  let TestModule: TestCommandModule<typeof gopeek>

  let playerService: jest.Mocked<PlayerService>

  let player: MockPlayer

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(gopeek, [
      PlayerService,
      LoggerService,
    ])

    playerService = TestModule.get(PlayerService)
  })

  beforeEach(() => {
    player = new MockPlayer()
  })

  it('should throw if there is no player', async () => {
    await expect(() => TestModule.execute()).rejects.toThrow(
      Errors.NoPlayer({
        message: 'Cannot peek queue, no active player in server.',
        sourceCmd: 'pause',
      })
    )
  })

  it('should peek the player and reply with a Queue', async () => {
    playerService.for.mockReturnValue(player._cast())
    player.peek.mockReturnValue([])

    await TestModule.execute()

    expect(player.peek).toHaveBeenCalledWith(20)
    expect(TestModule.message.addReply).toHaveBeenCalledTimes(1)
  })
})
