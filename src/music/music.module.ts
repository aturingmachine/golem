import { Module } from '@nestjs/common'
import { LocalMusicModule } from './local-music/local-music.module'
import { PlayerModule } from './player/player.module'
import { YoutubeModule } from './youtube/youtube.module'

@Module({
  imports: [PlayerModule, YoutubeModule, LocalMusicModule],
  providers: [],
  exports: [],
})
export class MusicModule {}
