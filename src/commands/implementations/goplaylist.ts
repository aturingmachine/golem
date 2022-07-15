import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { Golem } from '../../golem'
import { GolemMessage } from '../../messages/message-wrapper'
import { LocalTrack } from '../../music/tracks/track'
import { PlaylistMenu } from '../../playlist/playlist-menu'
import { GolemLogger, LogSources } from '../../utils/logger'
import { Replier } from '../../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoPlayList })

const execute = async (
  interaction: GolemMessage,
  playlist?: string
): Promise<void> => {
  log.verbose('invoked')

  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  const listName = interaction.parsed.getString('playlist')

  log.verbose(`invoked with ${playlist}`)

  if (listName) {
    log.verbose(`Attempting to find playlist`)
    const list = Golem.plex.playlists.find((list) =>
      list.name.toLowerCase().includes(listName.toLowerCase())
    )

    if (list) {
      log.verbose(`Enqueuing List ${list.name}`)
      const listings = Golem.trackFinder.findListingsByIds(list.listings)
      const tracks = LocalTrack.fromListings(listings, interaction.info.userId)

      await interaction.player.enqueueMany(interaction.info.userId, tracks)

      await interaction.reply(
        `${Replier.affirmative}, I'll queue up ${list.name}`
      )
    } else {
      await interaction.reply(`No playlist found with name ${listName}`)
    }
  } else {
    const menu = new PlaylistMenu(interaction)

    await menu.send()
    await menu.collectResponse()
  }
}

const goplaylist = new GolemCommand({
  logSource: LogSources.GoPlayList,
  handler: execute,
  info: {
    name: CommandNames.Base.playlist,
    description: {
      long: 'Play a given playlist by name. Presents a select of all playlists if no playlist name is provided. Requires enabling the Plex module and a local Plex Media Server.',
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
    examples: {
      legacy: ['$go playlist my-playlist', '$go playlist'],
      slashCommand: ['/goplaylist my-playlist', '/goplaylist'],
    },
    requiredModules: {
      all: [GolemModule.Plex, GolemModule.Music],
    },
  },
})

export default goplaylist
