import { MessageComponentInteraction } from 'discord.js'
import { Player } from '../player/music-player'
import { TrackFinder } from '../player/track-finder'
import { shuffleArray } from '../utils/list-utils'
import { logger } from '../utils/logger'
import { Replier } from '../utils/replies'
import { ButtonIdPrefixes } from './button-handler'

const log = logger.child({ src: 'artist button handler' })

export const artistPlayButtonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

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

    const artistTracks = TrackFinder.searchMany(artist).filter(
      (l) => l.artist.toLowerCase() === artist.toLowerCase()
    )

    if (interaction.guild) {
      Player.start({
        channelId: voiceChannel?.id || '',
        guildId: interaction.guildId || '',
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })
    }

    Player.enqueueMany(artistTracks)
  }
  // Shuffle
  else if (interaction.customId.includes(ButtonIdPrefixes.shuffleArtistPlay)) {
    log.info(`Button Confirmed Shuffle ${interaction.customId}`)

    await interaction.update({
      content: `${Replier.affirmative}, I'll shuffle **${artist}**`,
      components: [],
    })

    const artistTracks = TrackFinder.searchMany(artist).filter(
      (l) => l.artist.toLowerCase() === artist.toLowerCase()
    )

    if (interaction.guild) {
      Player.start({
        channelId: voiceChannel?.id || '',
        guildId: interaction.guildId || '',
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })
    }

    Player.enqueueMany(shuffleArray(artistTracks))
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
