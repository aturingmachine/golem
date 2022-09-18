import { ModuleRef } from '@nestjs/core'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { ParsedCommand } from '../../messages/parsed-command'
import { RawReply } from '../../messages/replies/raw'
import { SearchReply } from '../../messages/replies/search-reply'
import { ListingSearcher } from '../../music/library/searcher.service'

const gosearch = new GolemCommand({
  services: {
    log: LoggerService,
    search: ListingSearcher,
    builder: MessageBuilderService,
  },
  logSource: 'go-search',
  async handler(
    ref: ModuleRef,
    interaction: GolemMessage,
    source: ParsedCommand
  ): Promise<boolean> {
    try {
      this.services.log.setMessageContext(interaction, 'GoSearch')

      const searchQuery = source.getDefault('query', '').trim()
      let searchCount = source.getDefault('count', 5)

      this.services.log.verbose(
        `executing Query=${searchQuery}; Count=${searchCount}`
      )

      searchCount = searchCount > 10 ? 10 : searchCount

      if (!searchQuery.length) {
        this.services.log.warn(
          `No query provided by ${interaction.info.member?.user.username}`
        )
        await interaction.reply('No search string provided.')
      } else {
        const results = this.services.search.searchMany(searchQuery)

        if (results.length === 0) {
          this.services.log.warn(`No results for ${searchQuery}`)
          await interaction.reply(`No results found for ${searchQuery}`)
        }
        this.services.log.verbose(
          `Found ${results.length} results for ${searchQuery}`
        )

        const trimmedResults = results.slice(0, searchCount)

        await interaction._replies.add(
          new SearchReply(searchQuery, trimmedResults, results.length)
        )
      }

      return true
    } catch (error: any) {
      this.services.log.error(error)
      interaction._replies.add(new RawReply(error.message))
      return false
    }
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
    // requiredModules: {
    //   all: [GolemModule.Music],
    // },
  },
})

export default gosearch
