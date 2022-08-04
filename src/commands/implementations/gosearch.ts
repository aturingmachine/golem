import { ModuleRef } from '@nestjs/core'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { ParsedCommand } from '../../messages/parsed-command'
import { RawReply } from '../../messages/replies/raw'
import { SearchReply } from '../../messages/replies/search-reply'
import { ListingSearcher } from '../../music/library/searcher.service'

const execute = async (
  ref: ModuleRef,
  interaction: GolemMessage,
  source: ParsedCommand
): Promise<boolean> => {
  try {
    const log = await ref.resolve(LoggerService)
    log.setMessageContext(interaction, 'GoSearch')
    const searchService = await ref.resolve(ListingSearcher, undefined, {
      strict: false,
    })

    console.log('Running GoSearch Using Source:', source.toDebug())

    const searchQuery = source.getDefault('query', '').trim()
    let searchCount = source.getDefault('count', 5)

    log.verbose(`executing Query=${searchQuery}; Count=${searchCount}`)

    searchCount = searchCount > 10 ? 10 : searchCount

    if (!searchQuery.length) {
      log.warn(`No query provided by ${interaction.info.member?.user.username}`)
      await interaction.reply('No search string provided.')
    } else {
      const results = searchService.searchMany(searchQuery)
      console.log('GOSEARCH DEBUG>', results.length, results)

      if (results.length === 0) {
        log.warn(`No results for ${searchQuery}`)
        await interaction.reply(`No results found for ${searchQuery}`)
      }
      log.verbose(`Found ${results.length} results for ${searchQuery}`)

      const trimmedResults = results.slice(0, searchCount)

      interaction._replies.add(
        new SearchReply(searchQuery, trimmedResults, results.length)
      )
    }

    return true
  } catch (error: any) {
    console.log(error)
    interaction._replies.add(new RawReply(error.message))
    return false
  }
}

const gosearch = new GolemCommand({
  logSource: 'go-search',
  handler: execute,
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
    // requiredModules: {
    //   all: [GolemModule.Music],
    // },
  },
})

export default gosearch
