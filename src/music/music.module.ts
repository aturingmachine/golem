import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../core/logger/logger.module'
import { Library } from './local/library/library'
import { Album } from './local/listings/album'
import { LocalListing } from './local/listings/listings'
import { LocalMusicModule } from './local/local-music.module'
import { PlayQueryService } from './player/play-query.service'
import { PlayerService } from './player/player.service'
import { YoutubeMusicModule } from './youtube/youtube-music.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalListing, Library, Album]),
    LoggerModule,
    ConfigModule,

    LocalMusicModule.forRoot(),

    YoutubeMusicModule.forRoot(),
  ],
  providers: [PlayerService, PlayQueryService],
  exports: [PlayerService, PlayQueryService, LocalMusicModule],
})
export class MusicModule {}
