import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { getSearchReply } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoSearch })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.search)
  .setDescription('Search for tracks')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('query for a track')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('count')
      .setDescription(
        'Max number of results to return, defaults to 5, max of 10.'
      )
      .setRequired(false)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  query?: string,
  count?: number
): Promise<void> => {
  let searchQuery = query
  let searchCount = count || 5

  if (interaction instanceof CommandInteraction) {
    searchQuery = interaction.options.getString('query') || ''
    searchCount = interaction.options.getInteger('count') || 5
  }

  log.debug(`executing Query=${searchQuery}; Count=${searchCount}`)

  searchCount = searchCount > 10 ? 10 : searchCount

  if (!searchQuery) {
    log.warn(`No query provided by ${interaction.member?.user.username}`)
    await interaction.reply('No search string provided.')
  } else {
    searchQuery = searchQuery.trim()
    const results = Golem.trackFinder.searchMany(searchQuery)

    if (results.length === 0) {
      log.warn(`No results for ${searchQuery}`)
      await interaction.reply(`No results found for ${searchQuery}`)
      return
    }
    log.debug(`Found ${results.length} results for ${searchQuery}`)

    const trimmedResults = results.slice(0, searchCount)

    await interaction.reply(
      getSearchReply(searchQuery, trimmedResults, results.length)
    )
  }
}

const goSearchCommand = new Command(LogSources.GoSearch, data, execute)

export default goSearchCommand
