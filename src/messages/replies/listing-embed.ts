import {
  HexColorString,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { AListing } from '../../listing/listing'
import { getDurationBar } from '../../utils/message-utils'
import { humanReadableTime } from '../../utils/time-utils'
import { GolemMessage } from '../message-wrapper'

export class ListingEmbed {
  private image!: MessageAttachment | undefined
  public listing: AListing

  constructor(public message: GolemMessage, listing?: AListing) {
    if (listing) {
      this.listing = listing
    } else if (this.message.player.nowPlaying) {
      this.listing = this.message.player.nowPlaying
    } else {
      throw new Error('No listing provided')
    }
  }

  async send(
    context: 'queue' | 'play',
    content?: Partial<MessageOptions>
  ): Promise<void> {
    const options = await this.messageOptions(context)

    await this.message.reply({
      ...content,
      ...options,
    })
  }

  async messageOptions(context: 'queue' | 'play'): Promise<MessageOptions> {
    const embed =
      context === 'queue' ? await this.queueMessage() : await this.playMessage()

    return {
      embeds: [embed],
      files: this.image ? [this.image] : [],
    }
  }

  private async queueMessage(): Promise<MessageEmbed> {
    const embed = await this.toMessage()
    const title = this.message.player?.isPlaying
      ? 'Added to Queue'
      : 'Now Playing'
    const description = this.message.player?.isPlaying
      ? `Starts In: ${this.message.player?.stats.hTime}`
      : 'Starting Now'

    embed.setTitle(title).setDescription(description)

    return embed
  }

  private async playMessage(): Promise<MessageEmbed> {
    let description: string
    const title = 'Now Playing'

    const timeRemaining = humanReadableTime(
      this.message.player.currentTrackRemaining
    )

    if (this.message.player.currentResource) {
      const durationBar = getDurationBar(
        this.message.player.currentTrackRemaining,
        this.message.player.currentResource.metadata.listing.duration
      )
      description = `\`[${durationBar}] - ${timeRemaining}\``
    } else {
      description = `Remaining: ${timeRemaining}`
    }

    const embed = (await this.toMessage())
      .setTitle(title)
      .setDescription(description)

    return embed
  }

  private async toMessage(): Promise<MessageEmbed> {
    const listingEmbed = await this.listing.toEmbed()
    this.image = listingEmbed.image

    const embed = new MessageEmbed()
      .setDescription('')
      .setColor(listingEmbed.color.hex as HexColorString)
      .setThumbnail('')
      .setFields(listingEmbed.fields)

    return embed
  }
}
