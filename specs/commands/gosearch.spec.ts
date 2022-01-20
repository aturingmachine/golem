import '../../test-utils/mocks/mock-message'
import gosearch from '../../src/commands/implementations/gosearch'
import { getSearchReply } from '../../src/utils/message-utils'
import { executeCommand } from '../../test-utils'
import { MockGolem } from '../../test-utils/mocks/golem'
import {
  MockedLocalListing,
  MockLocalListing,
} from '../../test-utils/mocks/models/listing'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'

jest.mock('../../src/utils/message-utils', () => ({
  getSearchReply: jest.fn(),
}))

describe('gosearch', () => {
  let mockMessage: MockedMessage
  let localListings: MockedLocalListing[]
  const mockSearchReply = getSearchReply as jest.MockedFunction<
    typeof getSearchReply
  >

  beforeEach(() => {
    mockMessage = new MockMessage()
    localListings = [new MockLocalListing('listing-1')]
  })

  it('should not search if no query is provided', async () => {
    mockMessage.parsed.getDefault.mockReturnValueOnce('').mockReturnValueOnce(5)

    await executeCommand(gosearch, mockMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith('No search string provided.')
    expect(MockGolem.trackFinder.searchMany).not.toHaveBeenCalled()
  })

  it('should reply no results found if none are found', async () => {
    mockMessage.parsed.getDefault
      .mockReturnValueOnce('gugudan')
      .mockReturnValueOnce(5)
    MockGolem.trackFinder.searchMany.mockReturnValue([])

    await executeCommand(gosearch, mockMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith(
      'No results found for gugudan'
    )
    expect(MockGolem.trackFinder.searchMany).toHaveBeenCalledWith('gugudan')
  })

  it('should reply using the search reply made from the search results', async () => {
    const fakeOptions = { embeds: [] }
    mockMessage.parsed.getDefault
      .mockReturnValueOnce('gugudan')
      .mockReturnValueOnce(5)
    MockGolem.trackFinder.searchMany.mockReturnValue(localListings)
    mockSearchReply.mockReturnValue(fakeOptions)

    await executeCommand(gosearch, mockMessage)

    expect(mockMessage.reply).toHaveBeenCalledWith(fakeOptions)
  })
})
