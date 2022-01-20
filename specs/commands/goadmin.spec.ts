import '../../test-utils/mocks/handlers/mock-handlers'
import goadmin from '../../src/commands/implementations/goadmin'
import { MockAdminHandler } from '../../test-utils/mocks/handlers/admin'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goadmin', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
    mockMessage.info.permissions.isAdmin = true
  })

  it('should be gated on admin permissions', async () => {
    mockMessage.info.permissions.isAdmin = false

    await goadmin.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith({
      content: "You don't have the needed permissions to do that.",
    })
  })

  it('should require a valid subcommand', async () => {
    mockMessage.parsed.subCommand = undefined

    await goadmin.execute(mockMessage._toWrapper())

    expect(mockMessage.reply).toHaveBeenCalledWith({
      content: 'Command requires a subcommand',
    })
  })

  it('should call the handlers librefresh if the subcomand is librefresh', async () => {
    mockMessage.parsed.subCommand = 'librefresh'

    await goadmin.execute(mockMessage._toWrapper())

    expect(MockAdminHandler.libRefresh).toHaveBeenCalledWith(mockMessage)
  })

  it('should call the handlers getLatestBugReports if the subcomand is bugs', async () => {
    mockMessage.parsed.subCommand = 'bugs'

    await goadmin.execute(mockMessage._toWrapper())

    expect(MockAdminHandler.getLatestBugReports).toHaveBeenCalledWith(
      mockMessage
    )
  })
})
