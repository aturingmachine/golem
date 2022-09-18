import { Injectable } from '@nestjs/common'
import { LoggerService } from '../core/logger/logger.service'
import { AlbumService } from '../music/library/album.service'
import { AListing, LocalListing } from '../music/listings/listings'
import { PlayerService } from '../music/player/player.service'
import { GolemMessage } from './golem-message'
import { ListingReply } from './replies/listing-reply'
import { NowPlayingReply } from './replies/now-playing'
import { RawReply } from './replies/raw'

@Injectable()
export class MessageBuilderService {
  constructor(
    private log: LoggerService,
    private albumService: AlbumService,
    private players: PlayerService
  ) {
    this.log.setContext('MessageBuilderService')
  }

  async listingEmbed(
    message: GolemMessage,
    listing: AListing
  ): Promise<ListingReply | RawReply> {
    if (listing instanceof LocalListing) {
      return ListingReply.fromListing(message, listing)
    }

    return new RawReply('Not a Local Listing?')
  }

  async nowPlaying(
    message: GolemMessage,
    listing: AListing
  ): Promise<NowPlayingReply | RawReply> {
    const player = await this.players.getOrCreate(message)

    if (!player) {
      throw new Error('No Player')
    }

    if (listing instanceof LocalListing) {
      return NowPlayingReply.fromListing(message, listing, player)
    }

    return new RawReply('Not a Local Listing?')
  }
}
