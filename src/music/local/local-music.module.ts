import { DynamicModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../../core/logger/logger.module'
import { RawConfig } from '../../utils/raw-config'
import { AlbumService } from './library/album.service'
import { Library } from './library/library'
import { ListingLoaderService } from './library/loader.service'
import { SearchSchemes } from './library/search-schemes'
import { ListingSearcher } from './library/searcher.service'
import { Album } from './listings/album'
import { LocalListing } from './listings/listings'

@Module({})
export class LocalMusicModule {
  public static forRoot(): DynamicModule {
    if (RawConfig.hasLocalMusicModule) {
      // Now We Can Load!
      return {
        module: LocalMusicModule,

        imports: [
          TypeOrmModule.forFeature([LocalListing, Library, Album]),
          LoggerModule,
          ConfigModule,
        ],

        providers: [
          ListingLoaderService,
          ListingSearcher,
          SearchSchemes,
          AlbumService,
        ],

        exports: [ListingLoaderService, ListingSearcher, AlbumService],
      }
    }

    return {
      module: LocalMusicModule,
    }
  }
}
