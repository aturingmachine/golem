import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { LocalTrack } from '../models/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPlaylistEmbed, userFrom } from '../utils/message-utils'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = GolemLogger.child({ src: LogSources.PlaylistMenu })

export const playlistMenuHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const player = Golem.playerCache.getOrCreate(interaction)

  if (!player) {
    await interaction.update({
      content: 'Not in a valid voice channel.',
      components: [],
      embeds: [],
      files: [],
    })
    return
  }

  const choice = interaction.values[0]

  // Load more
  if (choice.startsWith(ButtonIdPrefixes.playlistLoadMore)) {
    const newOffset = parseInt(
      choice.replace(ButtonIdPrefixes.playlistLoadMore, ''),
      10
    )
    log.info(
      `Playlist Menu Handler: sending select more with offset ${newOffset}`
    )

    await interaction.update(GetPlaylistEmbed(newOffset))
  }
  // Play playlist
  else {
    const listName = choice.replace(ButtonIdPrefixes.playlistLoadMore, '')
    const playlist = Golem.plex.playlists.find((list) =>
      list.name.includes(listName)
    )

    if (playlist) {
      const listings = Golem.trackFinder.findListingsByIds(playlist?.listings)

      log.verbose('Playlist Menu Handler: starting Player.')

      await player.enqueueMany(
        userFrom(interaction),
        LocalTrack.fromListings(listings, userFrom(interaction))
      )

      await interaction.update({
        content: `${Replier.affirmative}, I'll queue up the playlist **${listName}**`,
        components: [],
      })
    } else {
      await interaction.update({
        content: `Unable to find playlist ${listName}`,
        components: [],
      })
    }
  }
}
