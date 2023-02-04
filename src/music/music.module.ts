import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../core/logger/logger.module'
import { Library } from './local/library/library'
import { Album } from './local/listings/album'
import { LocalListing } from './local/listings/listings'
import { LocalMusicModule } from './local/local-music.module'
import { PlayQueryService } from './player/play-query.service'
import { PlayerModule } from './player/player.module'
import { PlaylistModule } from './playlists/playlists.module'
import { YoutubeMusicModule } from './youtube/youtube-music.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalListing, Library, Album]),
    LoggerModule,
    ConfigModule,

    LocalMusicModule.forRoot(),

    YoutubeMusicModule.forRoot(),

    PlaylistModule,

    PlayerModule,
  ],

  providers: [PlayQueryService],

  exports: [PlayerModule, PlayQueryService, LocalMusicModule],
})
export class MusicModule {}
