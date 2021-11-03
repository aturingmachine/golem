import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { PlayHandler } from '../handlers/play-handler'
import { Command2 } from '../models/commands'
import { ArtistConfirmReply } from '../models/messages/artist-confirm'
import { WideSearch } from '../models/messages/wide-search'
import { GolemLogger, LogSources } from '../utils/logger'
import { Youtube } from '../youtube/youtils'

const log = GolemLogger.child({ src: LogSources.GoPlay })

// const helpInfo: CommandHelp = {
//   name: 'play',
//   msg: 'Search for and play a track. Will search youtube if query returns no local results.',
//   args: [
//     {
//       name: 'query',
//       type: 'string',
//       required: true,
//       description:
//         'The track to search for and play|A YouTube video/playlist URL to play.',
//     },
//   ],
//   alias: '$play',
// }

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.play)
//   .setDescription('Play Something')
//   .addStringOption((option) =>
//     option
//       .setName(helpInfo.args[0].name)
//       .setDescription(helpInfo.args[0].description)
//       .setRequired(helpInfo.args[0].required)
//   )

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

// const goPlayCommand = new Command({
//   source: LogSources.GoPlay,
//   data,
//   handler: execute,
//   helpInfo,
// })

const goplay = new Command2({
  logSource: LogSources.GoPlay,
  handler: execute,
  info: {
    name: CommandNames.play,
    description: {
      short:
        'Search for and play a track. Will search youtube if query returns no local results.',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          short:
            'The track to search for and play|A YouTube video/playlist URL to play.',
        },
        required: true,
      },
    ],
    examples: [
      '$go play twice tt',
      '$go play <youtube url>',
      '$go play <youtube playlist url>',
    ],
    requiredModules: [],
    alias: 'play',
  },
})

export default goplay
