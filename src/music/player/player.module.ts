import { Module } from '@nestjs/common'
import { PlayHandler } from './play-handler'

@Module({
  providers: [PlayHandler],
  exports: [PlayHandler],
})
export class PlayerModule {}
