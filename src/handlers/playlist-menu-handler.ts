import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { Plex } from '../plex'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = GolemLogger.child({ src: LogSources.PlaylistMenu })

export const playlistMenuHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    return
  }

  const choice = interaction.values[0]

  if (choice.startsWith(ButtonIdPrefixes.playlistLoadMore)) {
    const newOffset = parseInt(
      choice.replace(ButtonIdPrefixes.playlistLoadMore, ''),
      10
    )
    log.info(
      `Playlist Menu Handler: sending select more with offset ${newOffset}`
    )

    await interaction.reply(GetPlaylistEmbed(newOffset))
  } else {
    const listName = choice.replace(ButtonIdPrefixes.playlistLoadMore, '')
    const playlist = Plex.playlists.find((list) => list.name.includes(listName))

    if (playlist) {
      const listings = Golem.trackFinder.findListingsByIds(playlist?.listings)

      log.debug('Playlist Menu Handler: starting Player.')

      player.enqueueMany(interaction.member?.user.id || '', listings)

      await interaction.reply({
        content: `${Replier.affirmative}, I'll queue up the playlist **${listName}**`,
        components: [],
      })
    } else {
      await interaction.reply({
        content: `Unable to find playlist ${listName}`,
        components: [],
      })
    }
  }
}
