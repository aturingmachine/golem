import { Injectable } from '@nestjs/common'
import { LoggerService } from '../core/logger/logger.service'
import { AListing } from '../music/local/listings/listings'
import { PlayerService } from '../music/player/player.service'
import { GolemMessage } from './golem-message'
import { ListingReply } from './replies/listing-reply'
import { NowPlayingReply } from './replies/now-playing'
import { RawReply } from './replies/raw'

@Injectable()
export class MessageBuilderService {
  constructor(private log: LoggerService, private players: PlayerService) {
    this.log.setContext('MessageBuilder')
  }

  async listingEmbed(
    message: GolemMessage,
    listing: AListing
  ): Promise<ListingReply | RawReply> {
    return ListingReply.fromListing(listing)
  }

  async nowPlaying(
    message: GolemMessage,
    listing: AListing
  ): Promise<NowPlayingReply | RawReply> {
    const player = await this.players.getOrCreate(message)

    if (!player) {
      throw new Error('No Player')
    }

    return NowPlayingReply.fromListing(message, listing, player)
  }
}
