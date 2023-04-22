import { createReadStream } from 'fs'
import {
  Controller,
  Get,
  Header,
  Optional,
  Param,
  StreamableFile,
} from '@nestjs/common'
import { Guild, User } from 'discord.js'
import { ClientService } from '../core/client.service'
import { LoggerService } from '../core/logger/logger.service'
import { AlbumService } from '../music/local/library/album.service'
import { Library } from '../music/local/library/library'
import { ListingLoaderService } from '../music/local/library/loader.service'
import { Album } from '../music/local/listings/album'
import { LocalListing } from '../music/local/listings/listings'
import { PlayerService } from '../music/player/player.service'
import { ArrayUtils } from '../utils/list-utils'
import { WebService } from './web.service'

@Controller({ path: '/api' })
export class WebClientController {
  constructor(
    private log: LoggerService,
    private webService: WebService,
    private client: ClientService,
    private players: PlayerService,
    private albums: AlbumService,
    @Optional() private loader?: ListingLoaderService
  ) {}

  @Get('/guilds')
  @Header('Cache-Control', 'max-age=600')
  allGuilds(): { guilds: Guild[] } {
    return { guilds: this.client.guilds.toJSON() }
  }

  @Get('/libraries')
  @Header('Cache-Control', 'max-age=600')
  async allLibraries(): Promise<{ libraries: Library[] }> {
    return this.webService.allLibraries()
  }

  @Get('/listings')
  @Header('Cache-Control', 'max-age=600')
  async allListings(): Promise<{ listings: LocalListing[] }> {
    return this.webService.allListings()
  }

  @Get('/albums')
  @Header('Cache-Control', 'max-age=600')
  async allAlbums(): Promise<{ albums: Album[] }> {
    return this.webService.allAlbums()
  }

  @Get('/album-art/:path')
  @Header('Content-Type', 'image/jpeg')
  @Header('Cache-Control', 'max-age=31536000')
  albumArt(@Param('path') path: string): StreamableFile {
    const decoded = decodeURIComponent(path)
    return new StreamableFile(createReadStream(decoded))
  }

  @Get('/user/:id')
  userById(@Param('id') id: string): { user: User | undefined } {
    return { user: this.client.client?.users.cache.get(id) }
  }

  @Get('/users/:ids')
  usersById(@Param('ids') ids: string): { users: User[] } {
    const users = ids
      .split('|')
      .map((id) => this.client.client?.users.cache.get(id))
      .filter(ArrayUtils.isDefined)

    return { users: users }
  }
}
