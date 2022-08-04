import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../core/logger/logger.module'
import { Library } from './library/library'
import { ListingLoaderService } from './library/loader.service'
import { SearchSchemes } from './library/search-schemes'
import { ListingSearcher } from './library/searcher.service'
import { LocalListing } from './listings/listings'
import { PlayerService } from './player/player.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalListing, Library]),
    LoggerModule,
    ConfigModule,
  ],
  providers: [
    ListingLoaderService,
    ListingSearcher,
    PlayerService,
    SearchSchemes,
  ],
  exports: [ListingLoaderService, ListingSearcher, PlayerService],
})
export class MusicModule {}
