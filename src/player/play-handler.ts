import { GolemConf } from '../config'
import { Golem } from '../golem'
import { Youtube } from '../integrations/youtube/youtils'
import { YoutubeTrack } from '../integrations/youtube/youtube-track'
import { LocalListing } from '../listing/listing'
import { ParsedMessage } from '../messages/message-info'
import { GolemMessage } from '../messages/message-wrapper'
import { ArtistConfirmReply } from '../messages/replies/artist-confirm'
import { ListingEmbed } from '../messages/replies/listing-embed'
import { WideSearch } from '../messages/replies/wide-search'
import { LocalTrack } from '../tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { MusicPlayer } from './music-player'

export class PlayHandler {
  private log = GolemLogger.child({ src: LogSources.PlayHandler })

  async process(
    interaction: GolemMessage,
    options: {
      playNext?: boolean
    }
  ): Promise<void> {
    {
      if (!interaction.player) {
        await interaction.reply('Unable to play. Not in a valid voice channel.')
        this.log.info(`no channel to join, exiting early`)
        return
      }

      const commandQuery = interaction.parsed.getString('query')

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
        interaction.player.unpause()
        interaction.reply('Unpausing!')
        return
      }

      this.log.silly(`playing using query string ${commandQuery}`)

      // handle youtube plays
      if (this.isYoutubeQuery(commandQuery)) {
        await this.ytPlay(
          commandQuery,
          interaction,
          interaction.player,
          options.playNext
        )

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
          this.ytPlay(url, interaction, interaction.player, options.playNext)

          return
        }

        await interaction.reply(`No Results for **${commandQuery}**`)
        return
      }

      this.log.verbose(`Query Result: ${res.listing.debugString}`)

      // Handle artist query
      if (res.isArtistQuery) {
        if (options.playNext) {
          await interaction.reply(
            'cannot add artist discography to the front of the queue'
          )
          return
        }
        const confirmation = new ArtistConfirmReply(interaction, res.listing)

        await confirmation.send()
        await confirmation.collectResponse()

        return
      }

      // Handle Wide Queries
      if (res.isWideQuery) {
        if (options.playNext) {
          await interaction.reply('cannot execute wide queries for play next')
          return
        }

        const wide = new WideSearch(interaction)

        await wide.send()
        await wide.collectResponse()

        return
      }

      // Handle Catch-All queries
      await this.playLocal(
        res.listing,
        interaction,
        interaction.player,
        options.playNext
      )
    }
  }

  private async ytPlay(
    url: string,
    interaction: GolemMessage,
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

    // TODO this logic can be improved
    if (url.includes('list=') && !url.includes('index=')) {
      this.log.verbose('Playing youtube playlist')
      await this.playYtPlaylist(url, interaction, player)
    } else {
      this.log.verbose('Playing youtube track')
      await this.playYtTrack(url, interaction, player, playNext)
    }
  }

  private async playLocal(
    listing: LocalListing,
    interaction: GolemMessage,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const listingEmbed = new ListingEmbed(interaction, listing)
    const type = player.isPlaying ? 'queue' : 'play'

    this.log.verbose('enqueing local track')

    const track = new LocalTrack(listing, interaction.info.userId)

    await player.enqueue(track, playNext)

    await listingEmbed.send(type, playNext)
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
    interaction: GolemMessage,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const track = await YoutubeTrack.fromUrl(interaction.info.userId, url)
    const listingEmbed = new ListingEmbed(interaction, track.listing)
    const type = player.isPlaying ? 'queue' : 'play'

    this.log.verbose('enqueing youtube track')

    await player.enqueue(track, playNext)

    await listingEmbed.send(type, playNext)
  }

  /**
   * Play the result of a youtube playlist scrape
   * @param playlistUrl
   * @param interaction
   * @param player
   */
  private async playYtPlaylist(
    raw: string,
    interaction: GolemMessage,
    player: MusicPlayer
  ): Promise<void> {
    try {
      const parsed = new ParsedMessage(raw)
      const args = parsed.args

      const limit = args.limit ? parseInt(args.limit, 10) : undefined
      const isShuffle = !!args.shuffle

      this.log.verbose(`getting playlist`)
      interaction.reply(`Processing playlist \`${parsed.content}\`...`)
      const playlist = await Youtube.getPlaylist(
        parsed.content,
        limit,
        isShuffle
      )

      this.log.info(`enqueing youtube playlist ${playlist.title}`)

      await playlist.play(interaction.info.userId, player)

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
