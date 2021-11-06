import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { PlayHandler } from '../handlers/play-handler'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { ArtistConfirmReply } from '../models/messages/artist-confirm'
import { WideSearch } from '../models/messages/wide-search'
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
    // here we want to search for yt
    log.verbose(`No local ResultSet for ${commandQuery}`)

    const url = await Youtube.search(commandQuery)

    if (url) {
      PlayHandler.ytPlay(url, interaction, player)

      return
    }

    await interaction.reply(`No Results for **${query}**`)
    return
  }

  log.verbose(`Query Result: \n${res.listing.debugString}`)

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

const goplay = new Command({
  logSource: LogSources.GoPlay,
  handler: execute,
  info: {
    name: CommandNames.play,
    description: {
      long: 'Play a Local Track retrieved via searching for the provided query, a YouTube track retrievied via YouTube search if the Local Track search misses; A YouTube Track from a provided absolute url; A YouTube playlist from a provided absolute YouTube Playlist URL.',
      short:
        'Search for and play a track. Will search youtube if query returns no local results.',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          long: 'If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play. If a Youtube link is provided it will be played - if the link is a playlist it will have the first 20 tracks shuffled and queued. This number can be modified using the extended argument `limit=20`.',
          short:
            'The track to search for and play|A YouTube video/playlist URL to play.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: [
        '$go play twice tt',
        '$go play <youtube url>',
        '$go play <youtube playlist url>',
      ],
      slashCommand: [
        '/goplay twice tt',
        '/goplay <youtube url>',
        '/goplay <youtube playlist url>',
      ],
    },
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
    alias: 'play',
  },
})

export default goplay
