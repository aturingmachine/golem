import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command, CommandHelp } from '../models/commands'
import { GolemModule } from '../models/config'
import { LocalTrack } from '../models/track'
import { Plex } from '../plex'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoPlayList })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.playlist)
  .setDescription('Enqueue a playlist')
  .addStringOption((option) =>
    option
      .setName('playlist')
      .setDescription('the playlist to play')
      .setRequired(false)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  playlist?: string
): Promise<void> => {
  log.debug('invoked')
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

  log.debug(`invoked with ${playlist}`)

  if (listName.length) {
    log.debug(`Attempting to find playlist`)
    const list = Plex.playlists.find((list) =>
      list.name.toLowerCase().includes(listName.toLowerCase())
    )

    if (list) {
      log.debug(`Enqueuing List ${list.name}`)
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

const helpInfo: CommandHelp = {
  name: 'playlist',
  msg: 'Play a playlist sourced from a Plex server.',
  args: [
    {
      name: 'playlist',
      type: 'string',
      required: false,
      description: 'The playlist to play.',
      default: 'Returns a select of all playlists.',
    },
  ],
}

const goPlaylistCommand = new Command({
  source: LogSources.GoPlayList,
  data,
  handler: execute,
  helpInfo,
  requiredModules: [GolemModule.Plex],
})

export default goPlaylistCommand
