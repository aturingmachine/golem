import { MessageComponentInteraction } from 'discord.js'
import { logger } from '../utils/logger'

export const ButtonIdPrefixes = {
  confirmArtistPlay: 'confirm-play-',
  abortArtistPlay: 'abort-play-',
}

export const buttonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  if (interaction.customId.includes(ButtonIdPrefixes.confirmArtistPlay)) {
    const artist = interaction.customId.replace(
      ButtonIdPrefixes.confirmArtistPlay,
      ''
    )
    logger.info(`Button Confirmed Play ${interaction.customId}`)
    await interaction.update({
      content: `Fuckin Wicked, I'll play the artist **${artist}**`,
      components: [],
    })
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
