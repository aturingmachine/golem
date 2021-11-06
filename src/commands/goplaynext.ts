import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { PlayHandler } from '../handlers/play-handler'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'
import { Youtube } from '../youtube/youtils'

const log = GolemLogger.child({ src: LogSources.GoPlay })

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
        command: 'GoPlayNext',
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

  if (!GolemConf.modules.Music) {
    log.warn(`cannot execute for local track - missing Music module`)

    await interaction.reply(
      `Cannot play local track - missing required module - Music`
    )

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

const goplaynext = new Command({
  logSource: LogSources.GoPlayNext,
  handler: execute,
  info: {
    name: CommandNames.playNext,
    description: {
      long: 'Execute a Play command, queueing the track ahead of the passive queue, behind other tracks that have been Playnext-ed',
      short:
        'Play a track, queues at the front of the queue. (Behind other playnext tracks).',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          long: 'If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play.',
          short:
            'The track to search for and play|A YouTube video URL to play.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: [
        '$go playnext twice tt',
        '$go playnext <youtube url>',
        '$go playnext <youtube playlist url>',
      ],
      slashCommand: [
        '/goplaynext twice tt',
        '/goplaynext <youtube url>',
        '/goplaynext <youtube playlist url>',
      ],
    },
    alias: '$playnext',
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
  },
})

export default goplaynext
