import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../core/logger/logger.module'
import { AlbumService } from './library/album.service'
import { Library } from './library/library'
import { ListingLoaderService } from './library/loader.service'
import { SearchSchemes } from './library/search-schemes'
import { ListingSearcher } from './library/searcher.service'
import { Album } from './listings/album'
import { LocalListing } from './listings/listings'
import { PlayerService } from './player/player.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalListing, Library, Album]),
    LoggerModule,
    ConfigModule,
  ],
  providers: [
    ListingLoaderService,
    ListingSearcher,
    PlayerService,
    SearchSchemes,
    AlbumService,
  ],
  exports: [ListingLoaderService, ListingSearcher, PlayerService, AlbumService],
})
export class MusicModule {}
