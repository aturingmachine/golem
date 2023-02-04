import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../../core/logger/logger.module'
import { PermissionsModule } from '../../core/permissions/permissions.module'
import { LocalMusicModule } from '../local/local-music.module'
import { PlayerModule } from '../player/player.module'
import { YoutubeMusicModule } from '../youtube/youtube-music.module'
import { Playlist } from './playlist.model'
import { PlaylistService } from './playlist.service'

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([Playlist]),
    PermissionsModule,
    PlayerModule,
    LocalMusicModule.forRoot(),
    YoutubeMusicModule.forRoot(),
  ],

  providers: [PlaylistService],

  exports: [PlaylistService],
})
export class PlaylistModule {}
