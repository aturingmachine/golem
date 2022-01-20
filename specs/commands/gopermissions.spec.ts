import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/handlers/mock-handlers'
import gopermission from '../../src/commands/implementations/gopermission'
import { executeCommand } from '../../test-utils'
import { MockHandlers } from '../../test-utils/mocks/handlers/handlers'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('gopermission', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  it('should call the handlers describe function if subcommand is describe', async () => {
    mockMessage.parsed.subCommand = 'describe'

    await executeCommand(gopermission, mockMessage)

    expect(MockHandlers.Permissions.describe).toHaveBeenCalledWith(mockMessage)
  })

  it('should call the handlers get function if subcommand is get', async () => {
    mockMessage.parsed.subCommand = 'get'

    await executeCommand(gopermission, mockMessage)

    expect(MockHandlers.Permissions.get).toHaveBeenCalledWith(mockMessage)
  })

  it('should call the handlers set function if subcommand is set', async () => {
    mockMessage.parsed.subCommand = 'set'

    await executeCommand(gopermission, mockMessage)

    expect(MockHandlers.Permissions.set).toHaveBeenCalledWith(mockMessage)
  })

  it('should call the handlers add function if subcommand is add', async () => {
    mockMessage.parsed.subCommand = 'add'

    await executeCommand(gopermission, mockMessage)

    expect(MockHandlers.Permissions.add).toHaveBeenCalledWith(mockMessage)
  })

  it('should call the handlers remove function if subcommand is remove', async () => {
    mockMessage.parsed.subCommand = 'remove'

    await executeCommand(gopermission, mockMessage)

    expect(MockHandlers.Permissions.remove).toHaveBeenCalledWith(mockMessage)
  })

  it('should reply that the subcommand is invalid if it is unrecognized', async () => {
    mockMessage.parsed.subCommand = 'something-else'

    await executeCommand(gopermission, mockMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith(
      'Command "permission" requires a valid subcommand: **describe|get|set|add|remove**'
    )
  })
})
