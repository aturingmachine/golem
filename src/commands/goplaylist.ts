import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command2 } from '../models/commands'
import { GolemModule } from '../models/config'
import { LocalTrack } from '../models/track'
import { Plex } from '../plex'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoPlayList })

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.playlist)
//   .setDescription('Enqueue a playlist')
//   .addStringOption((option) =>
//     option
//       .setName('playlist')
//       .setDescription('the playlist to play')
//       .setRequired(false)
//   )

const execute = async (
  interaction: CommandInteraction | Message,
  playlist?: string
): Promise<void> => {
  log.verbose('invoked')
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  let listName = playlist || ''

  if (interaction instanceof CommandInteraction) {
    listName = interaction.options.getString('playlist') || ''
  }

  log.verbose(`invoked with ${playlist}`)

  if (listName.length) {
    log.verbose(`Attempting to find playlist`)
    const list = Plex.playlists.find((list) =>
      list.name.toLowerCase().includes(listName.toLowerCase())
    )

    if (list) {
      log.verbose(`Enqueuing List ${list.name}`)
      await player.enqueueMany(
        interaction.member?.user.id || '',
        LocalTrack.fromListings(
          Golem.trackFinder.findListingsByIds(list.listings),
          interaction.member?.user.id || ''
        )
      )
      await interaction.reply(
        `${Replier.affirmative}, I'll queue up ${list.name}`
      )
    } else {
      await interaction.reply(`No playlist found with name ${listName}`)
    }
  } else {
    await interaction.reply(GetPlaylistEmbed())
  }
}

// const helpInfo: CommandHelp = {
//   name: 'playlist',
//   msg: 'Play a playlist sourced from a Plex server.',
//   args: [
//     {
//       name: 'playlist',
//       type: 'string',
//       required: false,
//       description: 'The playlist to play.',
//       default: 'Returns a select of all playlists.',
//     },
//   ],
// }

// const goPlaylistCommand = new Command({
//   source: LogSources.GoPlayList,
//   data,
//   handler: execute,
//   helpInfo,
//   requiredModules: [GolemModule.Plex],
// })

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.playlist)
//   .setDescription('Enqueue a playlist')
//   .addStringOption((option) =>
//     option
//       .setName('playlist')
//       .setDescription('the playlist to play')
//       .setRequired(false)
//   )

const goplaylist = new Command2({
  logSource: LogSources.GoPlayList,
  handler: execute,
  info: {
    name: CommandNames.playlist,
    description: {
      short: 'Play a given playlist or choose one from a select menu.',
    },
    args: [
      {
        type: 'string',
        name: 'playlist',
        description: {
          short: 'The name of the playlist to queue.',
        },
        required: false,
      },
    ],
    examples: ['$go playlist my-playlist', '$go playlist'],
    requiredModules: [GolemModule.Plex],
  },
})

export default goplaylist
