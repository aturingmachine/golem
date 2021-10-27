import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { PlayHandler } from '../handlers/play-handler'
import { Command, CommandHelp } from '../models/commands'
import { ArtistConfirmReply } from '../models/messages/artist-confirm'
import { WideSearch } from '../models/messages/wide-search'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.play)
  .setDescription('Play Something')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('query for a track')
      .setRequired(true)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  query?: string
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  let commandQuery = query

  const isSlashCommand = interaction instanceof CommandInteraction

  if (isSlashCommand) {
    commandQuery = interaction.options.getString('query') || ''
  }

  if (interaction.member) {
    Analytics.push(
      new CommandAnalyticsInteraction(interaction, {
        command: 'GoPlay',
        content: commandQuery,
      })
    )
  }

  // if there is no query assume we should unpause
  if (!commandQuery) {
    player.unpause()
    return
  }

  // handle youtube plays
  if (PlayHandler.isYoutubeQuery(commandQuery)) {
    await PlayHandler.ytPlay(commandQuery, interaction, player)

    return
  }

  const res = Golem.trackFinder.search(commandQuery)

  if (!res) {
    log.debug(`GoPlay: No ResultSet`)
    await interaction.reply(`No Results for **${query}**`)
    return
  }

  log.debug(`Query Result: \n${res.listing.debugString}`)

  // Handle artist query
  if (res.isArtistQuery) {
    const confirmation = await ArtistConfirmReply.from(res.listing)

    await interaction.reply(confirmation)

    return
  }

  // Handle Wide Queries
  if (res.isWideQuery) {
    const embed = new WideSearch(commandQuery)

    await interaction.reply(embed.options)
    return
  }

  // Handle Catch-All queries
  await PlayHandler.playLocal(res.listing, interaction, player)
}

const helpInfo: CommandHelp = {
  name: 'stop',
  msg: 'Search for and play a track.',
  args: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description: 'The track to search for and play.',
    },
  ],
  alias: '$play',
}

const goPlayCommand = new Command({
  source: LogSources.GoPlay,
  data,
  handler: execute,
  helpInfo,
})

export default goPlayCommand
