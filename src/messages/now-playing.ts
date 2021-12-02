import { MessageOptions, MessageEmbed } from 'discord.js'
import { GetEmbedFromListing } from '../utils/message-utils'
import { GolemMessage } from './message-wrapper'

export class NowPlayingEmbed {
  constructor(public interaction: GolemMessage) {}

  async send(): Promise<void> {
    const options = await this.getOptions()
    await this.interaction.reply(options)
  }

  async getOptions(): Promise<MessageOptions> {
    if (this.interaction.player?.isPlaying) {
      const assets = await GetEmbedFromListing(
        this.interaction.player.nowPlaying!,
        this.interaction.player,
        'playing'
      )

      return {
        embeds: [assets.embed],
        files: assets.image ? [assets.image] : [],
      }
    } else {
      const embed = new MessageEmbed()
        .setTitle('Now Playing')
        .setDescription(
          'No Track is currently playing... Use `$play` to play a track!'
        )
      return {
        embeds: [embed],
      }
    }
  }
}
