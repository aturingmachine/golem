import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Plex } from '../plex'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'
import { _Command } from '../models/commands'

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
      player.enqueueMany(
        interaction.member?.user.id || '',
        Golem.trackFinder.findListingsByIds(list.listings)
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

const goPlaylistCommand = new _Command(LogSources.GoPlayList, data, execute)

export default goPlaylistCommand
