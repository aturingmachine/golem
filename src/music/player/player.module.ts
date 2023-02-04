import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from '../../core/logger/logger.module'
import { YoutubeMusicModule } from '../youtube/youtube-music.module'
import { PlayerService } from './player.service'

@Module({
  imports: [LoggerModule, ConfigModule, YoutubeMusicModule.forRoot()],

  providers: [PlayerService],

  exports: [PlayerService],
})
export class PlayerModule {}
