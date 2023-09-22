import { HexColorString, EmbedBuilder } from 'discord.js'
import { AListing } from '../../music/local/listings/listings'
import { MusicPlayer } from '../../music/player/player'
import { GolemMessage } from '../golem-message'
import { BaseReply } from './base'
import { ListingReply } from './listing-reply'
import { ReplyType } from './types'

export class NowPlayingReply extends BaseReply {
  type = ReplyType.NowPlaying
  isUnique = false

  static async fromListing(
    message: GolemMessage,
    listing: AListing,
    player?: MusicPlayer
  ): Promise<NowPlayingReply | ListingReply> {
    if (!player) {
      return ListingReply.fromListing(listing)
    }

    const listingEmbed = await listing.toEmbed()

    const isPlaying = !!player.currentResource

    const title = isPlaying ? 'Added to Queue' : 'Now Playing'

    const description = isPlaying
      ? `Starts In: ${player.stats.hTime}`
      : 'Starting Now'

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor((listingEmbed.color?.hex || '#C1A7E2') as HexColorString)
      .setDescription(description)
      .setThumbnail(listing.albumArtUrl)
      .setFields(listingEmbed.fields)

    return new NowPlayingReply({
      embeds: [embed],
      files: listingEmbed.image ? [listingEmbed.image] : [],
    })
  }
}
