import { DynamicModule, Module } from '@nestjs/common'
import { LoggerModule } from '../../core/logger/logger.module'
import { GolemModule, RawConfig } from '../../utils/raw-config'
import { YoutubeCache } from './cache/youtube-cache.service'
import { YoutubeService } from './youtube.service'

@Module({})
export class YoutubeMusicModule {
  public static forRoot(): DynamicModule {
    if (!RawConfig.modules.includes(GolemModule.Youtube)) {
      return { module: YoutubeMusicModule }
    }

    return {
      module: YoutubeMusicModule,

      imports: [LoggerModule],

      providers: [YoutubeService, YoutubeCache],

      exports: [YoutubeService],
    }
  }
}
