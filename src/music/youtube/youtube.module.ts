import { Module } from '@nestjs/common'
import { Youtube } from './youtils'

@Module({
  providers: [Youtube],
  exports: [Youtube],
})
export class YoutubeModule {}
