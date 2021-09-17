import { MessageComponentInteraction } from 'discord.js'
import { Golem } from '../golem'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = GolemLogger.child({ src: LogSources.ArtistButton })

export const artistPlayButtonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    return
  }

  const artist = interaction.customId
    .replace(ButtonIdPrefixes.confirmArtistPlay, '')
    .replace(ButtonIdPrefixes.shuffleArtistPlay, '')
    .replace(ButtonIdPrefixes.abortArtistPlay, '')

  // Confirm
  if (interaction.customId.includes(ButtonIdPrefixes.confirmArtistPlay)) {
    log.info(`Button Confirmed Play ${interaction.customId}`)

    await interaction.update({
      content: `${Replier.affirmative}, I'll play the artist **${artist}**`,
      components: [],
    })

    const artistTracks = Golem.trackFinder
      .searchMany(artist)
      .filter((l) => l.listing.artist.toLowerCase() === artist.toLowerCase())

    player.enqueueMany(interaction.member?.user.id || '', artistTracks)
  }
  // Shuffle
  else if (interaction.customId.includes(ButtonIdPrefixes.shuffleArtistPlay)) {
    log.info(`Button Confirmed Shuffle ${interaction.customId}`)

    await interaction.update({
      content: `${Replier.affirmative}, I'll shuffle **${artist}**`,
      components: [],
    })

    const artistTracks = Golem.trackFinder
      .searchMany(artist)
      .filter((track) => track.isArtist(artist))

    player.enqueueMany(
      interaction.member?.user.id || '',
      shuffleArray(artistTracks)
    )
  }
  // Cancel
  else if (interaction.customId.includes(ButtonIdPrefixes.abortArtistPlay)) {
    log.info(`Aborting Artist Play for ${artist}`)

    await interaction.update({
      content: `${Replier.neutral}, I won't queue the artist **${artist}**`,
      components: [],
    })
  }
}
