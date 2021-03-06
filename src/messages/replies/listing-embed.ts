import {
  HexColorString,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { AListing } from '../../listing/listing'
import { formatForLog } from '../../utils/debug-utils'
import { GolemLogger } from '../../utils/logger'
import { getDurationBar } from '../../utils/message-utils'
import { humanReadableTime } from '../../utils/time-utils'
import { GolemMessage, GolemMessageOpts } from '../message-wrapper'

export class ListingEmbed {
  private log = GolemLogger.child({ src: 'listing-embed' })
  private image!: MessageAttachment | undefined
  public listing: AListing

  constructor(public message: GolemMessage, listing?: AListing) {
    if (listing) {
      this.listing = listing
    } else if (this.message.player?.nowPlaying) {
      this.listing = this.message.player.nowPlaying
    } else {
      throw new Error('No listing provided')
    }
  }

  async send(
    context: 'queue' | 'play',
    isPlayNext?: boolean,
    content?: Partial<MessageOptions>
  ): Promise<void> {
    const options = await this.messageOptions(context, isPlayNext)

    await this.message.reply({
      ...content,
      ...options.asMessage(),
    })
  }

  async messageOptions(
    context: 'queue' | 'play',
    isPlayNext?: boolean
  ): Promise<GolemMessageOpts> {
    const embed =
      context === 'queue'
        ? await this.queueMessage(isPlayNext)
        : await this.playMessage()

    const options = {
      embeds: [embed],
      files: this.image ? [this.image] : [],
    }

    this.log.silly(
      `${this.listing.title} generated message embed ${formatForLog(options)}`
    )

    return new GolemMessageOpts(options)
  }

  private async queueMessage(isPlayNext?: boolean): Promise<MessageEmbed> {
    const embed = await this.toMessage()
    const title = this.message.player?.isPlaying
      ? 'Added to Queue'
      : 'Now Playing'
    const description = this.message.player?.isPlaying
      ? `Starts In: ${humanReadableTime(
          (!isPlayNext
            ? this.message.player?.stats.time
            : this.message.player?.stats.explicitTime) - this.listing.duration
        )}`
      : 'Starting Now'

    embed.setTitle(title).setDescription(description)

    return embed
  }

  private async playMessage(): Promise<MessageEmbed> {
    let description: string
    const title = 'Now Playing'

    if (!this.message.player) {
      throw new Error('Attempting to build ListingEmbed with no player.')
    }

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
      .setThumbnail(await this.thumbnail())
      .setFields(listingEmbed.fields)

    return embed
  }

  private async thumbnail(): Promise<string> {
    this.log.silly(
      `generating thumbnail uri for ${formatForLog({
        ...this.listing,
        album: !!this.listing.album ? 'OMIT' : 'UNDEFINED',
      })}`
    )

    const art = await this.listing.album?.getArt(200)

    if (!art || art.length < 0) {
      return ''
    }

    return typeof art !== 'string' ? 'attachment://cover.png' : art
  }
}
