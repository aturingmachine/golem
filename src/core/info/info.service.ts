import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GolemMessage } from '../../messages/golem-message'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { NowPlayingReply } from '../../messages/replies/now-playing'
import { RawReply } from '../../messages/replies/raw'
import { ListingLoaderService } from '../../music/local/library/loader.service'
import { PlayerService } from '../../music/player/player.service'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class InfoService {
  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private players: PlayerService,
    private builder: MessageBuilderService,
    @Optional() private loader?: ListingLoaderService
  ) {
    this.log.setContext('InfoService')
  }

  // TODO
  help(): RawReply {
    return new RawReply('Not yet implemented.')
  }

  /**
   * Get a NowPlaying embed for a Player derived from a GolemMessage
   * @param message
   * @returns a NowPlaying Reply
   */
  nowPlaying(message: GolemMessage): Promise<NowPlayingReply | RawReply> {
    const player = this.players.forGuild(message.info.guildId)

    if (!player || !player.nowPlaying) {
      this.log.warn(`cannot get player info for guild with no active player`)
      throw new Error('ENOPLAYER')
    }

    return this.builder.nowPlaying(message, player.nowPlaying)
  }

  /**
   * - number of local tracks
   * - loaded modules/things we can support
   * - server count?
   *
   * @todo
   */
  async botInfo(): Promise<void> {
    const info: Record<'title' | 'value', string>[] = []
    const moduleInfo = { title: 'Modules', value: '' }

    if (this.loader) {
      const trackCount = this.loader.records.length
      info.push({ title: 'Local Track Count', value: trackCount.toString() })
    }
  }
}
