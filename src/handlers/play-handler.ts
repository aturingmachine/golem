import { CommandInteraction, Message } from 'discord.js'
import { Listing } from '../models/listing'
import { YoutubePlaylistEmbed } from '../models/messages/yt-playlist'
import { LocalTrack, YoutubeTrack } from '../models/track'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing, userFrom } from '../utils/message-utils'
import { Youtube } from '../youtube/youtils'

export class PlayHandler {
  private static log = GolemLogger.child({ src: LogSources.PlayHandler })

  static async ytPlay(
    url: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    PlayHandler.log.info('Playing youtube resource')

    if (url.includes('list=')) {
      PlayHandler.log.debug('Playing youtube playlist')
      await PlayHandler.playYtPlaylist(url, interaction, player)
    } else {
      PlayHandler.log.debug('Playing youtube track')
      await PlayHandler.playYtTrack(url, interaction, player, playNext)
    }
  }

  static async playLocal(
    listing: Listing,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const { image, embed } = await GetEmbedFromListing(listing, player, 'queue')

    await interaction.reply({
      embeds: [embed],
      files: image ? [image] : [],
    })

    PlayHandler.log.debug('enqueing local track')

    const track = new LocalTrack(listing, interaction.member?.user.id || '')

    player.enqueue(track, playNext)
  }

  static isYoutubeQuery(query: string): boolean {
    return query.includes('youtube.com') || query.includes('youtu.be')
  }

  /**
   * Play a single Youtube Track
   * @param url
   * @param interaction
   * @param player
   * @param playNext
   */
  private static async playYtTrack(
    url: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const track = await YoutubeTrack.fromURL(
      url,
      interaction.member?.user.id || ''
    )

    PlayHandler.log.debug('enqueing youtube track')

    player.enqueue(track, playNext)

    const { embed } = await GetEmbedFromListing(track.metadata, player, 'queue')

    await interaction.reply({
      embeds: [embed],
    })
  }

  /**
   * Play the result of a youtube playlist scrape
   * @param playlistUrl
   * @param interaction
   * @param player
   */
  private static async playYtPlaylist(
    playlistUrl: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer
  ): Promise<void> {
    try {
      const userId = userFrom(interaction)

      PlayHandler.log.debug(`getting playlist`)
      const playlist = await Youtube.getPlaylist(playlistUrl)

      PlayHandler.log.debug(`got playlist`)

      PlayHandler.log.info(`enqueing youtube playlist ${playlist.title}`)

      for (const url of playlist.urls) {
        PlayHandler.log.debug(`creating track from url ${url}`)
        const track = await YoutubeTrack.fromURL(url, userId)
        PlayHandler.log.debug(`enqueueing track maade from url ${url}`)
        player.enqueue(track)
      }

      const embed = await YoutubePlaylistEmbed.from(
        playlist.title,
        playlist.thumbnail
      )

      await interaction.reply(embed.options)
    } catch (error) {
      console.error(error)
      PlayHandler.log.error(`error queueing youtube playlist ${error}`)

      await interaction.reply(
        `Something went wrong. Couldn't queue YouTube playlist.`
      )
    }
  }
}
