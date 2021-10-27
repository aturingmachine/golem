import { CommandInteraction, Message } from 'discord.js'
import { Listing } from '../models/listing'
import { LocalTrack, YoutubeTrack } from '../models/track'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

export class PlayHandler {
  private static log = GolemLogger.child({ src: LogSources.PlayHandler })

  static async ytPlay(
    query: string,
    interaction: CommandInteraction | Message,
    player: MusicPlayer,
    playNext = false
  ): Promise<void> {
    const track = await YoutubeTrack.fromURL(
      query,
      interaction.member?.user.id || ''
    )

    PlayHandler.log.debug('enqueing youtube track')

    player.enqueue(track, playNext)

    const { embed } = await GetEmbedFromListing(track.metadata, player, 'queue')

    await interaction.reply({
      embeds: [embed],
    })
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
}
