import gosearch from '../../src/commands/implementations/gosearch'
import { LoggerService } from '../../src/core/logger/logger.service'
import { Replies } from '../../src/messages/replies/replies'
import { ListingSearcher } from '../../src/music/local/library/searcher.service'
import { TestCommandModule } from '../mocks/command-module'
import { Mocker } from '../mocks/data'
import { TestUtils } from '../mocks/test-utils'

describe('Go Search', () => {
  let TestModule: TestCommandModule<typeof gosearch>

  let search: jest.Mocked<ListingSearcher>

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(gosearch, [
      LoggerService,
      ListingSearcher,
    ])

    search = TestModule.get(ListingSearcher)
  })

  beforeEach(() => {
    search.searchMany.mockClear()
  })

  it('should do nothing but reply if there is no search query', async () => {
    TestModule.source._mockedParams({ query: '' })

    await TestModule.execute()

    expect(search.searchMany).not.toHaveBeenCalled()
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      Replies.Raw('No search string provided.')
    )
  })

  it('should reply that there are no results if there are none', async () => {
    search.searchMany.mockReturnValue([])

    TestModule.source._mockedParams({ query: 'gugudan' })

    await TestModule.execute()

    expect(search.searchMany).toHaveBeenCalledWith('gugudan')
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      Replies.Raw('No results found for gugudan.')
    )
  })

  it('should reply with a search result for the query', async () => {
    const listing = Mocker.Listing.Local()
    search.searchMany.mockReturnValue([listing])

    TestModule.source._mockedParams({ query: 'gugudan' })

    await TestModule.execute()

    expect(search.searchMany).toHaveBeenCalledWith('gugudan')
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      Replies.Search('gugudan', [listing], 1)
    )
  })

  it('should trim the results to the length of the count param', async () => {
    const listings = TestUtils.listOf(5).map((i) =>
      Mocker.Listing.Local({ listingId: i.toString() })
    )
    search.searchMany.mockReturnValue(listings)

    TestModule.source._mockedParams({ query: 'gugudan', count: 3 })

    await TestModule.execute()

    expect(search.searchMany).toHaveBeenCalledWith('gugudan')
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      Replies.Search('gugudan', listings.slice(0, 3), 5)
    )
  })

  it('should use a max count of 10', async () => {
    const listings = TestUtils.listOf(15).map((i) =>
      Mocker.Listing.Local({ listingId: i.toString() })
    )
    search.searchMany.mockReturnValue(listings)

    TestModule.source._mockedParams({ query: 'gugudan', count: 13 })

    await TestModule.execute()

    expect(search.searchMany).toHaveBeenCalledWith('gugudan')
    expect(TestModule.message.addReply).toHaveBeenCalledWith(
      Replies.Search('gugudan', listings.slice(0, 10), 15)
    )
  })
})
