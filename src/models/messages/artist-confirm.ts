import { MessageEmbed, MessageOptions } from 'discord.js'
import { Golem } from '../../golem'
import { fourSquare } from '../../utils/image-utils'
import {
  GetMessageAttachement,
  averageColor,
  ArtistConfirmButton,
} from '../../utils/message-utils'
import { Listing } from '../listing'

export class ArtistConfirmReply {
  static async from(listing: Listing): Promise<MessageOptions> {
    const srcs = Golem.trackFinder.artistSample(listing.artist, 4)
    const albumArt = await fourSquare({
      images: {
        img1: srcs[0].albumArt,
        img2: srcs[1].albumArt,
        img3: srcs[2].albumArt,
        img4: srcs[3].albumArt,
      },
    })

    const image = GetMessageAttachement(albumArt)
    const color = await averageColor(albumArt)

    const row = ArtistConfirmButton(listing.artist)

    const embed = new MessageEmbed()
      .setTitle(`Play ${listing.artist}?`)
      .setDescription(
        `Looks like you might be looking for the artist: **${listing.artist}**.\nShould I queue their discography?`
      )
      .setColor(color.hex)
      .setImage('attachment://cover.png')

    return {
      embeds: [embed],
      components: [row],
      files: image ? [image] : [],
    }
  }
}
