import goplaynext from '../../src/commands/implementations/goplaynext'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
import { PlayQueryService } from '../../src/music/player/play-query.service'
import { PlayerService } from '../../src/music/player/player.service'
import { TestCommandModule } from '../mocks/command-module'
import { MockGolemMessage } from '../mocks/mock-message'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Play Next', () => {
  let TestModule: TestCommandModule<typeof goplaynext>

  let player: MockPlayer

  let playerService: jest.Mocked<PlayerService>
  let queryService: jest.Mocked<PlayQueryService>

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goplaynext, [
      LoggerService,
      PlayerService,
      PlayQueryService,
    ])

    playerService = TestModule.ref.get(PlayerService)
    queryService = TestModule.ref.get(PlayQueryService)
  })

  beforeEach(() => {
    player = new MockPlayer()

    playerService.getOrCreate.mockResolvedValue(player._cast())
  })

  describe('With No Query', () => {
    it('should unpause if the player is playing', async () => {
      player.isPlaying = true

      await TestModule.execute()

      expect(player.unpause).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the player is not playing', async () => {
      await expect(() => TestModule.execute()).rejects.toThrow()
    })
  })

  describe('With Query', () => {
    beforeEach(() => {
      TestModule.source.getString.mockReturnValue('gugudan pastel sweater')
    })

    it('should throw if the result is missing a module', async () => {
      const result = {
        missingModule: 'FakeModule',
        message: 'Missing Test Module: Fake Module',
      }
      queryService.process.mockResolvedValue(result)

      await expect(() => TestModule.execute()).rejects.toThrowError(
        Errors.NoModule({
          message: result.message,
          sourceCmd: 'play',
          action: 'play',
          required: [result.missingModule],
        })
      )
    })

    it('should throw a basic error if there are no results', async () => {
      const result = {
        message: 'Basic Error Test',
      }
      queryService.process.mockResolvedValue(result)

      await expect(() => TestModule.execute()).rejects.toThrowError(
        Errors.Basic({
          code: 101,
          message: result.message,
          sourceCmd: 'play',
          requiresAdminAttention: true,
        })
      )
    })

    it('should queue the query results tracks', async () => {
      const result = {
        tracks: [],
        replies: [],
      }
      queryService.process.mockResolvedValue(result)

      await TestModule.execute()

      expect(playerService.play).toHaveBeenCalledWith(
        MockGolemMessage,
        player,
        result.tracks,
        'next'
      )
      expect(MockGolemMessage.addReply).toHaveBeenCalledWith(result.replies)
    })
  })
})
