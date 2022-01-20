import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { Golem } from '../../golem'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'
import { getSearchReply } from '../../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoSearch })

const execute = async (interaction: GolemMessage): Promise<void> => {
  const searchQuery = interaction.parsed.getDefault('query', '').trim()
  let searchCount = interaction.parsed.getDefault('count', 5)

  log.verbose(`executing Query=${searchQuery}; Count=${searchCount}`)

  searchCount = searchCount > 10 ? 10 : searchCount

  if (!searchQuery.length) {
    log.warn(`No query provided by ${interaction.info.member?.user.username}`)
    await interaction.reply('No search string provided.')
  } else {
    const results = Golem.trackFinder.searchMany(searchQuery)

    if (results.length === 0) {
      log.warn(`No results for ${searchQuery}`)
      await interaction.reply(`No results found for ${searchQuery}`)
      return
    }
    log.verbose(`Found ${results.length} results for ${searchQuery}`)

    const trimmedResults = results.slice(0, searchCount)

    await interaction.reply(
      getSearchReply(searchQuery, trimmedResults, results.length)
    )
  }
}

const gosearch = new GolemCommand({
  logSource: LogSources.GoSearch,
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
    requiredModules: {
      all: [GolemModule.Music],
    },
  },
})

export default gosearch
