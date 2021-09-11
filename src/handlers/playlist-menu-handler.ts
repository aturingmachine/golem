import { SelectMenuInteraction } from 'discord.js'
import { Player } from '../player/music-player'
import { TrackFinder } from '../player/track-finder'
import { Plex } from '../plex'
import { logger } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = logger.child({ src: 'playlist menu handler' })

export const playlistMenuHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

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
      const listings = TrackFinder.findListingsByIds(playlist?.listings)

      if (interaction.guild && voiceChannel?.id) {
        log.debug('Playlist Menu Handler: starting Player.')

        Player.start({
          channelId: voiceChannel?.id || '',
          guildId: interaction.guildId || '',
          adapterCreator: interaction.guild.voiceAdapterCreator,
        })

        Player.enqueueMany(listings)

        await interaction.reply({
          content: `${Replier.affirmative}, I'll queue up the playlist **${listName}**`,
          components: [],
        })
      } else {
        interaction.channel?.send({
          content: 'Not in a valid voice channel.',
          components: [],
        })
      }
    } else {
      await interaction.reply({
        content: `Unable to find playlist ${listName}`,
        components: [],
      })
    }
  }
}
