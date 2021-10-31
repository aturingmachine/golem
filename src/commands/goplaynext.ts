import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { PlayHandler } from '../handlers/play-handler'
import { Command, CommandHelp } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { Youtube } from '../youtube/youtils'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.playNext)
  .setDescription('Add a track to the front of the play queue.')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription(
        'The track to search for and play|A YouTube video/playlist URL to play.'
      )
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

  if (!commandQuery) {
    await interaction.reply('No track query provided, cannot play next.')

    return
  }

  if (PlayHandler.isYoutubeQuery(commandQuery)) {
    await PlayHandler.ytPlay(commandQuery, interaction, player)

    return
  }

  const res = Golem.trackFinder.search(commandQuery)

  if (!res) {
    log.verbose(`No local ResultSet for ${commandQuery}`)

    const url = await Youtube.search(commandQuery)

    if (url) {
      PlayHandler.ytPlay(url, interaction, player, true)

      return
    }

    await interaction.reply(`No Results for **${query}**`)
    return
  }

  log.verbose(`Query Result: \n${res.listing.debugString}`)

  // Handle artist query
  if (res.isArtistQuery) {
    await interaction.reply(
      'cannot add artist discography to the front of the queue'
    )

    return
  }
  // Handle Wide Queries
  if (res.isWideQuery) {
    await interaction.reply('cannot execute wide queries for play next')

    return
  }
  // Handle Catch-All queries

  PlayHandler.playLocal(res.listing, interaction, player, true)
}

const helpInfo: CommandHelp = {
  name: 'playnext',
  msg: 'Play a track, queues at the front of the queue. (Behind other playnext tracks).',
  args: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description:
        'The track to search for and play|A YouTube video/playlist URL to play.',
    },
  ],
  alias: '$playnext',
}

const goPlayNextCommand = new Command({
  source: LogSources.GoPlayNext,
  data,
  handler: execute,
  helpInfo,
})

export default goPlayNextCommand
