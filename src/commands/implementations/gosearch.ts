import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { SearchReply } from '../../messages/replies/search-reply'
import { ListingSearcher } from '../../music/local/library/searcher.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    log: LoggerService,
    search: ListingSearcher,
    builder: MessageBuilderService,
  },
  logSource: 'GoSearch',
  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, this.options.logSource)

    const searchQuery = source.getDefault('query', '').trim()
    let searchCount = source.getDefault('count', 5)

    this.services.log.verbose(
      `executing Query=${searchQuery}; Count=${searchCount}`
    )

    searchCount = searchCount > 10 ? 10 : searchCount

    if (!searchQuery.length) {
      this.services.log.warn(
        `No query provided by ${message.info.member?.user.username}`
      )
      await message.reply('No search string provided.')
    } else {
      const results = this.services.search.searchMany(searchQuery)

      if (results.length === 0) {
        this.services.log.warn(`No results for ${searchQuery}`)
        await message.reply(`No results found for ${searchQuery}`)
      }
      this.services.log.verbose(
        `Found ${results.length} results for ${searchQuery}`
      )

      const trimmedResults = results.slice(0, searchCount)

      await message._replies.add(
        new SearchReply(searchQuery, trimmedResults, results.length)
      )
    }

    return true
  },
  info: {
    name: CommandNames.Base.search,
    description: {
      short: 'Search for a local track and view the result set.',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          short: 'The query to run against the Local Search Index.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: ['$go search twice tt'],
      slashCommand: ['/gosearch twice tt'],
    },
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
  },
})
