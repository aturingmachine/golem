import gostop from '../../src/commands/implementations/gostop'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
import { MessageBuilderService } from '../../src/messages/message-builder.service'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Stop', () => {
  let TestModule: TestCommandModule<typeof gostop>

  let playerService: jest.Mocked<PlayerService>

  let player: MockPlayer

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(gostop, [
      LoggerService,
      PlayerService,
    ])

    playerService = TestModule.get(PlayerService)
  })

  beforeEach(() => {
    player = new MockPlayer()

    playerService.for.mockReturnValue(player._cast())
  })

  it('should throw if there is no player', async () => {
    playerService.for.mockReturnValue(undefined)

    await expect(() => TestModule.execute()).rejects.toThrow(
      Errors.NoPlayer({
        message: `cannot stop player for server with no active player. Server: Running on Empty channel: Cigar Lounge`,
        sourceCmd: 'stop',
      })
    )

    expect(player.stop).not.toHaveBeenCalled()
    expect(TestModule.message.addReply).not.toHaveBeenCalled()
  })

  it('should call stop and reply', async () => {
    await TestModule.execute()

    expect(player.stop).toHaveBeenCalledTimes(1)
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      'Playback stopped and queue cleared.'
    )
  })
})
