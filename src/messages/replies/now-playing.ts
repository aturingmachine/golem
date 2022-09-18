import { HexColorString, MessageEmbed } from 'discord.js'
import { AListing } from '../../music/listings/listings'
import { MusicPlayer } from '../../music/player/player'
import { GolemMessage } from '../golem-message'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class NowPlayingReply extends BaseReply {
  type = ReplyType.NowPlaying
  isUnique = false

  static async fromListing(
    message: GolemMessage,
    listing: AListing,
    player: MusicPlayer
  ): Promise<NowPlayingReply> {
    const listingEmbed = await listing.toEmbed()

    const title = player.isPlaying ? 'Added to Queue' : 'Now Playing'
    const description = player.isPlaying ? `Starts In: ` : 'Starting Now'

    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(listingEmbed.color.hex as HexColorString)
      .setDescription(description)
      .setThumbnail('attachment://cover.png')
      .setFields(listingEmbed.fields)

    return new NowPlayingReply({
      embeds: [embed],
      files: listingEmbed.image ? [listingEmbed.image] : [],
    })
  }
}
