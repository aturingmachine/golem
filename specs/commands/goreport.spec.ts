import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/mock-bug-report'
import '../../test-utils/mocks/mock-replier'
import goreport from '../../src/commands/implementations/goreport'
import { executeCommand } from '../../test-utils'
import {
  MockBugReport,
  MockedBugReport,
} from '../../test-utils/mocks/models/bug-report'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

describe('goreport', () => {
  let mockMessage: MockedMessage
  let mockReport: MockedBugReport

  beforeEach(() => {
    mockMessage = new MockMessage()
    mockReport = MockBugReport()
    MockBugReport.fromMessage.mockReturnValue(mockReport)

    mockReport.save.mockClear()
  })

  it('should create a new bug report', async () => {
    await executeCommand(goreport, mockMessage)

    expect(mockReport.save).toHaveBeenCalled()
    expect(mockMessage.reply).toHaveBeenCalledWith(
      "affirmative, I've recorded your bug report!"
    )
  })
})
