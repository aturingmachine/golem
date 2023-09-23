import { EmbedBuilder, HexColorString } from 'discord.js'
import { AListing } from '../../music/local/listings/listings'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class ListingReply extends BaseReply {
  type = ReplyType.Listing
  isUnique = false

  static async fromListing(listing: AListing): Promise<ListingReply> {
    const listingEmbed = await listing.toEmbed()

    const title = listing.title
    const description = `${listing.artist} - ${listing.title}`

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(listingEmbed.color.hex as HexColorString)
      .setDescription(description)
      .setThumbnail(listing.albumArtUrl)
      .setFields(listingEmbed.fields)

    return new ListingReply({ embeds: [embed] })
  }
}
