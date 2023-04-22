import {
  Controller,
  Delete,
  Get,
  Header,
  Optional,
  Param,
} from '@nestjs/common'
import { ClientService } from '../core/client.service'
import { LoggerService } from '../core/logger/logger.service'
import { AlbumService } from '../music/local/library/album.service'
import { ListingLoaderService } from '../music/local/library/loader.service'
import { MusicPlayerJSON } from '../music/player/player'
import { PlayerService } from '../music/player/player.service'
import { WebService } from './web.service'

@Controller({ path: '/api/players' })
export class PlayerController {
  constructor(
    private log: LoggerService,
    private webService: WebService,
    private client: ClientService,
    private players: PlayerService,
    private albums: AlbumService,
    @Optional() private loader?: ListingLoaderService
  ) {}

  @Get('/')
  @Header('Cache-Control', 'max-age=600')
  allPlayers(): { players: MusicPlayerJSON[] } {
    return this.webService.allPlayers()
  }

  @Delete('/:guildId')
  async stopPlayer(
    @Param('guildId') guildId: string
  ): Promise<{ status: string }> {
    await this.players.destroy(guildId)

    return { status: 'ok' }
  }
}
