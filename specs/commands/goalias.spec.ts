import goalias from '../../src/commands/implementations/goalias'
import { MockHandlers } from '../../test-utils/mocks/handlers/handlers'
import { MockedMessage, MockMessage } from '../../test-utils/mocks/message'

describe('goalias', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
    mockMessage.info.permissions.isAdmin = true
    mockMessage.parsed.getString.mockClear()
    MockHandlers._clearAll()
  })

  it('should require a subscommand', async () => {
    mockMessage.parsed.subCommand = undefined

    await goalias.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith(
      'Please provide a valid subcommand'
    )
  })

  describe('create', () => {
    beforeEach(() => {
      mockMessage.parsed.subCommand = 'create'
    })

    it('should gate on having an aliascommand param', async () => {
      mockMessage.parsed.getString.mockReturnValue(null)

      await goalias.execute(mockMessage._toWrapper())

      expect(mockMessage.reply).toHaveBeenCalledWith(
        'Command requires a valid alias string'
      )
    })

    it('should call the AliasHandler:createAlias', async () => {
      mockMessage.parsed.getString.mockReturnValue('gugudan')

      await goalias.execute(mockMessage._toWrapper())

      expect(MockHandlers.Alias.createAlias).toHaveBeenCalledWith(
        mockMessage,
        'gugudan'
      )
    })
  })

  describe('list', () => {
    it('should call the AliasHandler:listAliases', async () => {
      mockMessage.parsed.subCommand = 'list'

      await goalias.execute(mockMessage._toWrapper())

      expect(MockHandlers.Alias.listAliases).toHaveBeenCalledWith(
        mockMessage,
        mockMessage.info.guildId
      )
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      mockMessage.parsed.subCommand = 'delete'
    })

    it('should gate on having an aliasname param', async () => {
      mockMessage.parsed.getString.mockReturnValue(null)

      await goalias.execute(mockMessage._toWrapper())

      expect(mockMessage.reply).toHaveBeenCalledWith(
        'Command requires a valid alias name'
      )
    })

    it('should call the AliasHandler:deleteAlias', async () => {
      mockMessage.parsed.getString.mockReturnValue('ioi')

      await goalias.execute(mockMessage._toWrapper())

      expect(MockHandlers.Alias.deleteAlias).toHaveBeenCalledWith(
        mockMessage,
        'ioi'
      )
    })
  })
})
