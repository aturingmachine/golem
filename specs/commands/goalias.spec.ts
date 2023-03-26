import goalias from '../../src/commands/implementations/goalias'
import { CustomAlias } from '../../src/core/alias/alias.model'
import { AliasService } from '../../src/core/alias/alias.service'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Errors } from '../../src/errors'
import { RawReply } from '../../src/messages/replies/raw'
import { TestCommandModule } from '../mocks/command-module'

describe('Go Alias', () => {
  let TestModule: TestCommandModule<typeof goalias>

  let aliasService: jest.Mocked<AliasService>

  let alias: CustomAlias

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goalias, [
      LoggerService,
      AliasService,
    ])

    aliasService = TestModule.ref.get(AliasService)

    alias = new CustomAlias()
    alias.name = 'gugudan'
  })

  describe('Create', () => {
    it('should create an alias', async () => {
      aliasService.create.mockResolvedValue(alias)

      await TestModule.executeSubcommand('create')

      expect(aliasService.create).toHaveBeenCalledWith(
        TestModule.message.info.userId,
        TestModule.message.info.guildId,
        TestModule.source
      )
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply(`Created alias: gugudan.`)
      )
    })
  })

  describe('Delete', () => {
    it('should throw if there is no aliasname argument', async () => {
      TestModule.source.getString.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('delete')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'alias-name',
          message: `Missing required "aliasname" parameter. Correct usage is "alias delete <alias-name>"`,
          sourceCmd: '',
        })
      )
    })

    it('should delete the alias', async () => {
      TestModule.source.getString.mockReturnValue('gugudan')

      await TestModule.executeSubcommand('delete')

      expect(aliasService.delete).toHaveBeenCalledWith({
        userId: TestModule.message.info.userId,
        guildId: TestModule.message.info.guildId,
        aliasName: 'gugudan',
      })
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply('Deleted alias gugudan')
      )
    })
  })

  describe('List', () => {
    it('should return the list of aliases', async () => {
      aliasService.listForGuild.mockResolvedValue('List!')

      await TestModule.executeSubcommand('list')

      expect(aliasService.listForGuild).toHaveBeenCalledWith(
        TestModule.message.info.guildId
      )
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply('```\nList!\n```')
      )
    })
  })
})
