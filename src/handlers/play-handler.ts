import { CommandInteraction, Message } from 'discord.js'
import { GolemConf } from '../config'
import { Youtube } from '../integrations/youtube/youtils'
import { YoutubeTrack } from '../integrations/youtube/youtube-track'
import { Listing } from '../listing/listing'
import { MusicPlayer } from '../player/music-player'
import { LocalTrack } from '../tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { ParsedMessage } from '../utils/message-args'
import { GetEmbedFromListing, userFrom } from '../utils/message-utils'

export class PlayHandler {
  private static log = GolemLogger.child({ src: LogSources.PlayHandler })

  static async ytPlay(
    url: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    if (!GolemConf.modules.Youtube) {
      PlayHandler.log.info(
        'Cannot play youtube resource, Youtube module not enabled'
      )
      await interaction.reply(
        'Cannot play youtube resource, the YouTube module is not enabled.'
      )
      return
    }

    PlayHandler.log.info(`Playing youtube resource ${url}`)

    if (url.includes('list=')) {
      PlayHandler.log.verbose('Playing youtube playlist')
      await PlayHandler.playYtPlaylist(url, interaction, player)
    } else {
      PlayHandler.log.verbose('Playing youtube track')
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

    PlayHandler.log.verbose('enqueing local track')

    const track = new LocalTrack(listing, interaction.member?.user.id || '')

    await player.enqueue(track, playNext)
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
    const track = await YoutubeTrack.fromUrl(
      interaction.member?.user.id || '',
      url
    )

    PlayHandler.log.verbose('enqueing youtube track')

    await player.enqueue(track, playNext)

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
      const parsedMessage = new ParsedMessage(playlistUrl)
      const args = parsedMessage.args

      const limit = args.limit ? parseInt(args.limit, 10) : undefined
      const isShuffle = !!args.shuffle
      const userId = userFrom(interaction)

      PlayHandler.log.verbose(`getting playlist`)
      interaction.reply(`Processing playlist \`${parsedMessage.content}\`...`)
      const playlist = await Youtube.getPlaylist(
        parsedMessage.content,
        limit,
        isShuffle
      )

      PlayHandler.log.info(`enqueing youtube playlist ${playlist.title}`)

      await playlist.play(userId, player)

      await interaction.reply((await playlist.embed).options)
    } catch (error) {
      console.error(error)
      PlayHandler.log.error(`error queueing youtube playlist ${error}`)

      await interaction.reply(
        `Something went wrong. Couldn't queue YouTube playlist. One or more tracks may not have queued.`
      )
    }
  }
}
