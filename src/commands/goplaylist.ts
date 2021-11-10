import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { LocalTrack } from '../models/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoPlayList })

const execute = async (
  interaction: CommandInteraction | Message,
  playlist?: string
): Promise<void> => {
  log.verbose('invoked')
  const player = Golem.playerCache.getOrCreate(interaction)

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
    const list = Golem.plex.playlists.find((list) =>
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

const goplaylist = new Command({
  logSource: LogSources.GoPlayList,
  handler: execute,
  info: {
    name: CommandNames.playlist,
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
