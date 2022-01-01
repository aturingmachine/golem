import { ButtonInteraction, MessageEmbed, MessageOptions } from 'discord.js'
import { Golem } from '../../golem'
import { ButtonIdPrefixes } from '../../handlers/button-handler'
import { LocalListing } from '../../listing/listing'
import { LocalTrack } from '../../tracks/track'
import { ImageUtils } from '../../utils/image-utils'
import { ArrayUtils } from '../../utils/list-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { GetMessageAttachement, averageColor } from '../../utils/message-utils'
import { Replier } from '../../utils/replies'
import { ButtonRow } from '../button-row'
import { CustomId } from '../custom-id'
import { GolemMessage } from '../message-wrapper'

export class ArtistConfirmReply {
  private static log = GolemLogger.child({ src: LogSources.ArtistButton })

  constructor(
    public readonly interaction: GolemMessage,
    public readonly sourceListing: LocalListing
  ) {}

  async send(): Promise<void> {
    const options = await this.getMessageOptions()
    ArtistConfirmReply.log.info('sending response')
    await this.interaction.reply({ ...options, fetchReply: true })
  }

  async collectResponse(): Promise<void> {
    ArtistConfirmReply.log.info('mounting collector')
    await this.interaction.collector(
      {
        componentType: 'BUTTON',
        time: 30_000,
      },
      this.handler.bind(this)
    )
  }

  private async handler(clickInteraction: ButtonInteraction): Promise<void> {
    ArtistConfirmReply.log.info('executing handler')

    if (!this.interaction.player) {
      await clickInteraction.update({
        content: 'Not in a valid voice channel.',
        components: [],
      })
      return
    }

    const handlerOptions = CustomId.fromString<ButtonIdPrefixes>(
      clickInteraction.customId
    ).config
    const artist = handlerOptions.args.artist as string
    const run = handlerOptions.args.run

    switch (run) {
      case 'play':
      case 'shuffle':
        const isShuffle = run === 'shuffle'

        clickInteraction.update({
          content: `${Replier.affirmative}, I'll ${
            isShuffle ? 'shuffle' : 'play'
          } the artist **${artist}**`,
          components: [],
          embeds: [],
          files: [],
          attachments: [],
        })

        const artistTracks = Golem.trackFinder
          .searchMany(artist)
          .filter((listing) => listing.isArtist(artist))

        await this.interaction.player.enqueueMany(
          this.interaction.info.userId,
          LocalTrack.fromListings(
            isShuffle ? ArrayUtils.shuffleArray(artistTracks) : artistTracks,
            this.interaction.info.userId
          )
        )

        break
      case 'cancel':
      default:
        ArtistConfirmReply.log.info(`Aborting Artist Play for ${artist}`)

        await clickInteraction.update({
          content: `${Replier.neutral}, I won't queue the artist **${artist}**`,
          components: [],
          embeds: [],
          files: [],
          attachments: [],
        })
        break
    }
  }

  private async getMessageOptions(): Promise<MessageOptions> {
    const srcs = Golem.trackFinder.artistSample(this.sourceListing.artist, 4)
    const albumArt = await ImageUtils.fourSquare({
      images: {
        img1: srcs[0].albumArt,
        img2: srcs[1].albumArt,
        img3: srcs[2].albumArt,
        img4: srcs[3].albumArt,
      },
    })

    const image = GetMessageAttachement(albumArt)
    const color = await averageColor(albumArt)

    // const row = ArtistConfirmButton(this.listing.artist)
    const buttons = new ButtonRow({
      type: ButtonIdPrefixes.ArtistPlay,
      buttons: [
        {
          label: 'Yes',
          style: 'SUCCESS',
          customId: {
            command: '__CUSTOM__',
            args: {
              artist: this.sourceListing.artist,
              run: 'play',
            },
          },
        },
        {
          label: 'Shuffle',
          style: 'PRIMARY',
          customId: {
            command: '__CUSTOM__',
            args: {
              artist: this.sourceListing.artist,
              run: 'shuffle',
            },
          },
        },
        {
          label: 'No',
          style: 'DANGER',
          customId: {
            command: '__CUSTOM__',
            args: {
              artist: this.sourceListing.artist,
              run: 'cancel',
            },
          },
        },
      ],
    })

    const embed = new MessageEmbed()
      .setTitle(`Play ${this.sourceListing.artist}?`)
      .setDescription(
        `Looks like you might be looking for the artist: **${this.sourceListing.artist}**.\nShould I queue their discography?`
      )
      .setColor(color.hex)
      .setImage('attachment://cover.png')

    return {
      embeds: [embed],
      components: [buttons.toRow()],
      files: image ? [image] : [],
    }
  }
}
