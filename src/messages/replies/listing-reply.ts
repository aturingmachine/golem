import { MessageEmbed, HexColorString } from 'discord.js'
import { AListing } from '../../music/listings/listings'
import { GolemMessage } from '../golem-message'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class ListingReply extends BaseReply {
  type = ReplyType.Listing
  isUnique = false

  static async fromListing(
    message: GolemMessage,
    listing: AListing
  ): Promise<ListingReply> {
    const listingEmbed = await listing.toEmbed()

    const title = listing.title
    const description = `${listing.artist} - ${listing.title}`

    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(listingEmbed.color.hex as HexColorString)
      .setDescription(description)
      .setThumbnail('attachment://cover.png')
      .setFields(listingEmbed.fields)

    return new ListingReply({ embeds: [embed] })
  }
}
