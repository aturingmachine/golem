import { MessageComponentInteraction } from 'discord.js'
import { Golem } from '../golem'
import { LocalTrack } from '../models/track'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = GolemLogger.child({ src: LogSources.ArtistButton })

export const artistPlayButtonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  const player = Golem.players.getOrCreate(interaction)

  if (!player) {
    await interaction.update({
      content: 'Not in a valid voice channel.',
      components: [],
      embeds: [],
      files: [],
    })
    return
  }

  const artist = interaction.customId
    .replace(ButtonIdPrefixes.confirmArtistPlay, '')
    .replace(ButtonIdPrefixes.shuffleArtistPlay, '')
    .replace(ButtonIdPrefixes.abortArtistPlay, '')

  const userId = interaction.member?.user.id || ''

  // Confirm
  if (interaction.customId.includes(ButtonIdPrefixes.confirmArtistPlay)) {
    log.info(`Button Confirmed Play ${interaction.customId}`)

    await interaction.update({
      content: `${Replier.affirmative}, I'll play the artist **${artist}**`,
      components: [],
      embeds: [],
      files: [],
    })

    const artistTracks = Golem.trackFinder
      .searchMany(artist)
      .filter((l) => l.artist.toLowerCase() === artist.toLowerCase())

    await player.enqueueMany(
      userId,
      LocalTrack.fromListings(artistTracks, userId)
    )
  }

  // Shuffle
  else if (interaction.customId.includes(ButtonIdPrefixes.shuffleArtistPlay)) {
    log.info(`Button Confirmed Shuffle ${interaction.customId}`)

    await interaction.update({
      content: `${Replier.affirmative}, I'll shuffle **${artist}**`,
      components: [],
      embeds: [],
      files: [],
    })

    const artistTracks = Golem.trackFinder
      .searchMany(artist)
      .filter((listing) => listing.isArtist(artist))

    await player.enqueueMany(
      userId,
      LocalTrack.fromListings(shuffleArray(artistTracks), userId)
    )
  }

  // Cancel
  else if (interaction.customId.includes(ButtonIdPrefixes.abortArtistPlay)) {
    log.info(`Aborting Artist Play for ${artist}`)

    await interaction.update({
      content: `${Replier.neutral}, I won't queue the artist **${artist}**`,
      components: [],
      embeds: [],
      files: [],
    })
  }
}
