import {
  AttachmentBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageReplyOptions,
} from 'discord.js'
import { PlexLogo } from '../../../constants'
import { LoggerService } from '../../../core/logger/logger.service'
import { Errors } from '../../../errors'
import { ListingSearcher } from '../../../music/local/library/searcher.service'
import { PlayerService } from '../../../music/player/player.service'
import { LocalTrack } from '../../../music/tracks/local-track'
import { ImageUtils } from '../../../utils/image-utils'
import { ArrayUtils } from '../../../utils/list-utils'
import { LogUtils } from '../../../utils/log-utils'
import { GolemMessage } from '../../golem-message'
import { BaseReply } from '../base'
import { NowPlayingReply } from '../now-playing'
import { ReplyType } from '../types'
import { ButtonIdPrefixes } from './constants'
import { ButtonRow } from './core/button-row'
import { CustomId } from './custom-id'

export const GetMessageAttachement = (albumArt?: Buffer): AttachmentBuilder => {
  return new AttachmentBuilder(albumArt || PlexLogo, {})
}

export class ArtistQueryReply extends BaseReply {
  readonly type = ReplyType.ArtistQuery
  readonly isUnique = false

  constructor(
    opts: MessageReplyOptions,
    readonly source: GolemMessage,
    readonly artist: string,
    readonly searcher: ListingSearcher,
    readonly players: PlayerService,
    readonly log: LoggerService
  ) {
    super(opts)
  }

  async collect() {
    await this.source.collector(
      {
        componentType: ComponentType.Button,
        time: 30_000,
      },
      async (interaction) => {
        const custom_id = CustomId.fromString<ButtonIdPrefixes>(
          interaction.customId
        )
        const handlerOptions = custom_id.config

        const run: 'play' | 'shuffle' | 'cancel' | string = handlerOptions.args
          .run as string

        this.log.info(
          `handling collection with parsed config as ${custom_id.toDebug()}`
        )

        if (!['play', 'shuffle'].includes(run)) {
          this.log.info(`user is cancelling Artist Query.`)

          await interaction.update({
            content: `Ok, I won't play "${this.artist}"`,
            components: [],
            embeds: [],
            files: [],
          })

          return
        }

        const player = await this.players.getOrCreate(this.source)

        if (!player) {
          this.log.warn(
            `unable to create player for guild: ${this.source.info.guild?.name} channel: ${this.source.info.voiceChannel?.name}`
          )

          throw Errors.NoPlayer({
            message: `unable to create player for guild: ${this.source.info.guild?.name} channel: ${this.source.info.voiceChannel?.name}`,
            sourceCmd: 'play',
            traceId: this.source.traceId,
          })
        }

        const isShuffle = run === 'shuffle'

        let results = this.searcher
          .searchMany(this.artist)
          .filter((listing) => listing.isArtist(this.artist))

        if (isShuffle) {
          results = ArrayUtils.shuffleArray(results)

          await interaction.update({
            content: `Ok, I will shuffle tracks from "${this.artist}"`,
            components: [],
            embeds: [],
            files: [],
          })
        } else {
          await interaction.update({
            content: `Ok, I will play tracks from "${this.artist}"`,
            components: [],
            embeds: [],
            files: [],
          })
        }

        const tracks = results.map((listing) =>
          LocalTrack.fromListing(listing, this.source.info.userId)
        )

        await this.players.play(this.source, player, tracks, 'queue')

        const npReply = await NowPlayingReply.fromListing(
          this.source,
          player.nowPlaying || results[0],
          player,
          true
        )

        await this.source.reply(npReply.opts)
      }
    )
  }

  static async fromQuery(
    artist: string,
    message: GolemMessage,
    searcher: ListingSearcher,
    players: PlayerService
  ): Promise<ArtistQueryReply> {
    const log = await LogUtils.createLogger('ArtistQueryReply', message)
    const artistTracks = await searcher.forArtist(artist)
    let srcs: Buffer[] = []
    const albumNames: string[] = []

    console.log(artistTracks)

    // TODO make not gross
    let i = 0
    while (srcs.length < 4) {
      const album = artistTracks[i].album

      if (!album) {
        srcs = srcs.concat(
          (await searcher.artistSample(artist, 4)).map((l) =>
            l.album.covers.small.get()
          )
        )
        break
      }

      const art = album.covers.small.get()

      if (!!art && !albumNames.includes(album.name)) {
        srcs.push(art)
        albumNames.push(album.name)
      }

      i++
    }

    const albumArt = await ImageUtils.fourSquare({
      images: {
        img1: srcs[0],
        img2: srcs[1],
        img3: srcs[2],
        img4: srcs[3],
      },
    })

    const image = new AttachmentBuilder(albumArt || PlexLogo, {
      name: '4squarecover.jpg',
    })
    const color = await ImageUtils.averageColor(albumArt)

    const embed = new EmbedBuilder()
      .setTitle(`Play ${artist}?`)
      .setDescription(
        `Looks like you might be looking for the artist: **${artist}**.\nShould I queue their discography?`
      )
      .setColor(color.hex)
      .setImage('attachment://4squarecover.jpg')

    const row = new ButtonRow({
      type: ButtonIdPrefixes.ArtistPlay,
      buttons: [
        {
          label: 'Yes',
          style: ButtonStyle.Success,
          customId: {
            command: '__CUSTOM__',
            args: {
              artist,
              run: 'play',
            },
          },
        },
        {
          label: 'Shuffle',
          style: ButtonStyle.Primary,
          customId: {
            command: '__CUSTOM__',
            args: {
              artist,
              run: 'shuffle',
            },
          },
        },
        {
          label: 'No',
          style: ButtonStyle.Danger,
          customId: {
            command: '__CUSTOM__',
            args: {
              artist,
              run: 'cancel',
            },
          },
        },
      ],
    })

    return new ArtistQueryReply(
      {
        components: [row.toRow()],
        embeds: [embed],
        files: [image],
      },
      message,
      artist,
      searcher,
      players,
      log
    )
  }
}
