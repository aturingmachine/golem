import { CommandInteraction, Message } from 'discord.js'
import { GolemConf } from '../config'
import { Golem } from '../golem'
import { Youtube } from '../integrations/youtube/youtils'
import { YoutubeTrack } from '../integrations/youtube/youtube-track'
import { LocalListing } from '../listing/listing'
import { ArtistConfirmReply } from '../messages/replies/artist-confirm'
import { WideSearch } from '../messages/replies/wide-search'
import { MusicPlayer } from '../player/music-player'
import { LocalTrack } from '../tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { ParsedMessage } from '../utils/message-args'
import { GetEmbedFromListing, userFrom } from '../utils/message-utils'

export class PlayHandler {
  private log = GolemLogger.child({ src: LogSources.PlayHandler })

  async process(
    interaction: CommandInteraction | Message,
    options: {
      playNext: boolean
      query?: string
    }
  ): Promise<void> {
    {
      const player = Golem.playerCache.getOrCreate(interaction)

      if (!player) {
        await interaction.reply('Not in a valid voice channel.')
        this.log.info(`no channel to join, exiting early`)
        return
      }

      let commandQuery = options.query

      const isSlashCommand = interaction instanceof CommandInteraction

      if (isSlashCommand) {
        commandQuery = interaction.options.getString('query') || ''
      }

      // TODO Analytics
      // if (interaction.member) {
      //   Analytics.push(
      //     new CommandAnalyticsInteraction(interaction, {
      //       command: 'GoPlay',
      //       content: commandQuery,
      //     })
      //   )
      // }

      // if there is no query assume we should unpause
      if (!commandQuery) {
        player.unpause()
        return
      }

      // handle youtube plays
      if (this.isYoutubeQuery(commandQuery)) {
        await this.ytPlay(commandQuery, interaction, player, options.playNext)

        return
      }

      if (!GolemConf.modules.Music) {
        this.log.warn(`cannot execute for local track - missing Music module`)

        await interaction.reply(
          `Cannot play local track - missing required module - Music`
        )

        return
      }

      const res = Golem.trackFinder.search(commandQuery)

      if (!res) {
        this.log.verbose(`No local ResultSet for ${commandQuery}`)

        const url = await Youtube.search(commandQuery)

        if (url) {
          this.ytPlay(url, interaction, player, options.playNext)

          return
        }

        await interaction.reply(`No Results for **${options.query}**`)
        return
      }

      this.log.verbose(`Query Result: \n${res.listing.debugString}`)

      // Handle artist query
      if (res.isArtistQuery) {
        if (options.playNext) {
          await interaction.reply(
            'cannot add artist discography to the front of the queue'
          )
          return
        }
        const confirmation = await ArtistConfirmReply.from(res.listing)

        await interaction.reply(confirmation)

        return
      }

      // Handle Wide Queries
      if (res.isWideQuery) {
        if (options.playNext) {
          await interaction.reply('cannot execute wide queries for play next')
          return
        }

        const embed = new WideSearch(commandQuery)

        await interaction.reply(embed.options)
        return
      }

      // Handle Catch-All queries
      await this.playLocal(res.listing, interaction, player, options.playNext)
    }
  }

  private async ytPlay(
    url: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    if (!GolemConf.modules.Youtube) {
      this.log.info('Cannot play youtube resource, Youtube module not enabled')
      await interaction.reply(
        'Cannot play youtube resource, the YouTube module is not enabled.'
      )
      return
    }

    this.log.info(`Playing youtube resource ${url}`)

    if (url.includes('list=')) {
      this.log.verbose('Playing youtube playlist')
      await this.playYtPlaylist(url, interaction, player)
    } else {
      this.log.verbose('Playing youtube track')
      await this.playYtTrack(url, interaction, player, playNext)
    }
  }

  private async playLocal(
    listing: LocalListing,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const { image, embed } = await GetEmbedFromListing(listing, player, 'queue')

    await interaction.reply({
      embeds: [embed],
      files: image ? [image] : [],
    })

    this.log.verbose('enqueing local track')

    const track = new LocalTrack(listing, interaction.member?.user.id || '')

    await player.enqueue(track, playNext)
  }

  isYoutubeQuery(query: string): boolean {
    return query.includes('youtube.com') || query.includes('youtu.be')
  }

  /**
   * Play a single Youtube Track
   * @param url
   * @param interaction
   * @param player
   * @param playNext
   */
  private async playYtTrack(
    url: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const track = await YoutubeTrack.fromUrl(
      interaction.member?.user.id || '',
      url
    )

    this.log.verbose('enqueing youtube track')

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
  private async playYtPlaylist(
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

      this.log.verbose(`getting playlist`)
      interaction.reply(`Processing playlist \`${parsedMessage.content}\`...`)
      const playlist = await Youtube.getPlaylist(
        parsedMessage.content,
        limit,
        isShuffle
      )

      this.log.info(`enqueing youtube playlist ${playlist.title}`)

      await playlist.play(userId, player)

      await interaction.reply((await playlist.embed).options)
    } catch (error) {
      console.error(error)
      this.log.error(`error queueing youtube playlist ${error}`)

      await interaction.reply(
        `Something went wrong. Couldn't queue YouTube playlist. One or more tracks may not have queued.`
      )
    }
  }
}
