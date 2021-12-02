import { MessageComponentInteraction } from 'discord.js'
import { GolemLogger, LogSources } from '../utils/logger'
// import { wideSearchHandler } from './wide-search-handler'

export enum ButtonIdPrefixes {
  confirmArtistPlay = 'artist-search-confirm-',
  abortArtistPlay = 'artist-search-abort-',
  shuffleArtistPlay = 'artist-search-shuffle',
  wideSearchPlay = 'wideSearch',
  playlistLoadMore = 'playlist-load-more-',
  ArtistPlay = 'playArtist',
}

export enum SelectMenuId {
  WideSearch = 'wideSearch',
  Playlist = 'playlist',
}

export const buttonHandler = async (
  interaction: MessageComponentInteraction
): Promise<void> => {
  GolemLogger.info(`${interaction.customId}`, { src: LogSources.ButtonHandler })
  // if (
  //   [
  //     ButtonIdPrefixes.abortArtistPlay,
  //     ButtonIdPrefixes.confirmArtistPlay,
  //     ButtonIdPrefixes.shuffleArtistPlay,
  //   ].some((prefix) => interaction.customId.includes(prefix))
  // ) {
  //   await artistPlayButtonHandler(interaction)
  // }

  // if (
  //   interaction.customId.includes(ButtonIdPrefixes.wideSearchPlay) &&
  //   interaction.isSelectMenu()
  // ) {
  //   await wideSearchHandler(interaction)
  // }

  // if (
  //   interaction.customId.includes(ButtonIdPrefixes.playlistLoadMore) &&
  //   interaction.isSelectMenu()
  // ) {
  //   await playlistMenuHandler(interaction)
  // }
}
