import { createReadStream } from 'fs'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Optional,
  Param,
  Put,
  Query,
  StreamableFile,
  Post,
  Delete,
} from '@nestjs/common'
import { Guild, User } from 'discord.js'
import fuzzy from 'fuzzy'
import { CompiledGolemScript, GSCompiler } from '../ast/compiler'
import { AstParseResult } from '../ast/parser'
import { ClientService } from '../core/client.service'
import { ConfigurationOptions } from '../core/configuration'
import { GuildConfig } from '../core/guild-config/guild-config.model'
import { LoggerService } from '../core/logger/logger.service'
import {
  CachedStream,
  CachedStreamType,
} from '../music/cache/cached-stream.model'
import { AlbumService } from '../music/local/library/album.service'
import { Library } from '../music/local/library/library'
import { ListingLoaderService } from '../music/local/library/loader.service'
import { SearchResult } from '../music/local/library/searcher.service'
import { Album } from '../music/local/listings/album'
import { LocalListing } from '../music/local/listings/listings'
import { PlayerService } from '../music/player/player.service'
import { YoutubeCache } from '../music/youtube/cache/youtube-cache.service'
import { WebService } from './web.service'

@Controller({ path: '/api' })
export class WebClientController {
  constructor(
    private log: LoggerService,
    private webService: WebService,
    private client: ClientService,
    private players: PlayerService,
    private albums: AlbumService,
    @Optional() private loader?: ListingLoaderService,
    @Optional() private ytCache?: YoutubeCache
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

  @Get('/listings/search')
  @Header('Cache-Control', 'max-age=600')
  searchListings(@Query('q') queryValue: string): {
    results: {
      results: fuzzy.FilterResult<LocalListing>[]
      top?: SearchResult
    }
  } {
    return { results: this.webService.searchListings(queryValue) }
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
  async userById(@Param('id') id: string): Promise<{ user: User | undefined }> {
    console.log(this.client.client?.users.cache.values())

    return { user: await this.client.userById(id) }
  }

  @Get('/users/:ids')
  async usersById(@Param('ids') ids: string): Promise<{ users: User[] }> {
    const splitIds = ids.split('|').filter(Boolean)
    this.log.debug(`getting users: [${splitIds.join(', ')}]`)
    const users: User[] = []

    for (const id of splitIds) {
      try {
        const u = await this.client.userById(id)
        if (u) {
          users.push(u)
        }
      } catch (error) {
        this.log.debug(`could not get user ${id}`)
      }
    }

    return { users: users }
  }

  @Get('/config')
  config(): ConfigurationOptions {
    return this.webService.getConfig()
  }

  @Put('/config')
  updateConfig(
    @Body() body: { path: string; value: unknown }
  ): ConfigurationOptions {
    return this.webService.setConfig(body.path, body.value)
  }

  @Get('/guild-configs')
  async guildConfigs(): Promise<{ configs: GuildConfig[] }> {
    const configs = await this.webService.getAllGuildConfigs()

    return { configs }
  }

  @Post('/ast/parse')
  parseAst(@Body() body: { script: string }): {
    ast: AstParseResult
    compiled: CompiledGolemScript
  } {
    if (!body.script) {
      throw new BadRequestException({
        message: '"script" property is required in request.',
      })
    }

    try {
      const result = GSCompiler.fromString(body.script)

      return result
    } catch (error) {
      throw new BadRequestException({
        message: 'unable to compile script.',
        error,
      })
    }
  }

  @Get('/cache/:cache_type')
  async getCachedStreams(@Param('cache_type') cache_type: string): Promise<{
    entries: CachedStream[] | undefined
  }> {
    this.log.info(`Getting cached streams for type ${cache_type}`)

    switch (cache_type) {
      case CachedStreamType.YouTube:
        return { entries: await this.ytCache?.allDbEntries() }
      default:
        return { entries: [] }
        break
    }
  }

  @Delete('/cache/:cache_type/:id')
  async deleteCachedStream(
    @Param('cache_type') cache_type: string,
    @Param('id') id: string
  ): Promise<{
    entries: CachedStream[] | undefined
  }> {
    this.log.info(`delete cached stream ${id} for type ${cache_type}`)

    switch (cache_type) {
      case CachedStreamType.YouTube:
        await this.ytCache?.deleteById(id)

        return { entries: await this.ytCache?.allDbEntries() }
      default:
        return { entries: [] }
        break
    }
  }
}
