import { MessageEmbed } from 'discord.js'
import { GolemMessage, GolemMessageOpts } from './message-wrapper'
import { ListingEmbed } from './replies/listing-embed'

export class NowPlayingEmbed {
  constructor(public interaction: GolemMessage) {}

  async send(): Promise<void> {
    const options = await this.getOptions()
    await this.interaction.reply(options)
  }

  async getOptions(): Promise<GolemMessageOpts> {
    if (this.interaction.player?.isPlaying) {
      const listingEmbed = new ListingEmbed(this.interaction)

      return listingEmbed.messageOptions('play')
    } else {
      const embed = new MessageEmbed()
        .setTitle('Now Playing')
        .setDescription(
          'No Track is currently playing... Use `$play` to play a track!'
        )

      return new GolemMessageOpts({
        embeds: [embed],
      })
    }
  }
}
