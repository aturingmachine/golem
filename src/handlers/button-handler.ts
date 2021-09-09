import { MessageComponentInteraction } from 'discord.js'
import { TrackFinder } from '../player/track-finder'
import { logger } from '../utils/logger'
import { Player } from '../voice/voice-handler'

export const ButtonIdPrefixes = {
  confirmArtistPlay: 'confirm-play-',
  abortArtistPlay: 'abort-play-',
}

export const buttonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  if (interaction.customId.includes(ButtonIdPrefixes.confirmArtistPlay)) {
    const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
    const member = guild?.members.cache.get(interaction.member?.user.id || '')
    const voiceChannel = member?.voice.channel

    const artist = interaction.customId.replace(
      ButtonIdPrefixes.confirmArtistPlay,
      ''
    )
    logger.info(`Button Confirmed Play ${interaction.customId}`)
    await interaction.update({
      content: `Fuckin Wicked, I'll play the artist **${artist}**`,
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
  } else if (interaction.customId.includes(ButtonIdPrefixes.abortArtistPlay)) {
    const artist = interaction.customId.replace(
      ButtonIdPrefixes.abortArtistPlay,
      ''
    )
    logger.info(`Aborting Artist Play for ${artist}`)

    await interaction.update({
      content: `Sure thing, I won't queue the artist **${artist}**`,
      components: [],
    })
  }
}
