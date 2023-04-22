import { Module } from '@nestjs/common'
import { ClientModule } from '../core/client.module'
import { CoreModule } from '../core/core.module'
import { LoggerModule } from '../core/logger/logger.module'
import { LocalMusicModule } from '../music/local/local-music.module'
import { PlayerModule } from '../music/player/player.module'
import { PlayerController } from './player.controller'
import { WebClientController } from './web.controller'
import { WebService } from './web.service'
import { WS } from './websocket.gateway'

@Module({
  controllers: [WebClientController, PlayerController],

  providers: [WebService, WS],

  imports: [
    LoggerModule,
    ClientModule,
    PlayerModule,
    CoreModule,
    LocalMusicModule.forRoot(),
  ],
})
export class WebModule {}
