import { DynamicModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from '../../core/logger/logger.module'
import { MusicModule } from '../../music/music.module'
import { GolemModule, RawConfig } from '../../utils/raw-config'
import { PlexService } from './plex.service'

@Module({})
export class PlexModule {
  public static forRoot(): DynamicModule {
    if (!RawConfig.modules.includes(GolemModule.Plex)) {
      return { module: PlexModule }
    }

    return {
      module: PlexModule,

      imports: [LoggerModule, ConfigModule, MusicModule],

      providers: [PlexService],

      exports: [PlexService],
    }
  }
}
