import { MessageComponentInteraction } from 'discord.js'
import { logger } from '../utils/logger'
import { artistPlayButtonHandler } from './artist-play-handler'
import { wideSearchHandler } from './wide-search-handler'

export const ButtonIdPrefixes = {
  confirmArtistPlay: 'artist-search-confirm-',
  abortArtistPlay: 'artist-search-abort-',
  shuffleArtistPlay: 'artist-search-shuffle',
  wideSearchPlay: 'wide-select-',
}

export const buttonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  logger.info(`Button Handler: ${interaction.customId}`)
  if (
    [
      ButtonIdPrefixes.abortArtistPlay,
      ButtonIdPrefixes.confirmArtistPlay,
      ButtonIdPrefixes.shuffleArtistPlay,
    ].some((prefix) => interaction.customId.includes(prefix))
  ) {
    await artistPlayButtonHandler(interaction)
  }

  if (
    interaction.customId.includes(ButtonIdPrefixes.wideSearchPlay) &&
    interaction.isSelectMenu()
  ) {
    await wideSearchHandler(interaction)
  }
}
