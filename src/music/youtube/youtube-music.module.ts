import { DynamicModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../../core/logger/logger.module'
import { GolemModule, RawConfig } from '../../utils/raw-config'
import { CachedStream } from '../cache/cached-stream.model'
import { YoutubeCache } from './cache/youtube-cache.service'
import { YoutubeSearch } from './youtube-search.service'
import { YoutubeService } from './youtube.service'

@Module({})
export class YoutubeMusicModule {
  public static forRoot(): DynamicModule {
    if (!RawConfig.modules.includes(GolemModule.Youtube)) {
      return {
        module: YoutubeMusicModule,
      }
    }

    return {
      module: YoutubeMusicModule,

      imports: [LoggerModule, TypeOrmModule.forFeature([CachedStream])],

      providers: [YoutubeService, YoutubeCache, YoutubeSearch],

      exports: [YoutubeService, YoutubeCache, YoutubeSearch],
    }
  }
}
