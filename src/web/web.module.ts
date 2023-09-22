import { Module } from '@nestjs/common'
import { ClientModule } from '../core/client.module'
import { CoreModule } from '../core/core.module'
import { GuildConfigModule } from '../core/guild-config/guild-config.module'
import { LoggerModule } from '../core/logger/logger.module'
import { LocalMusicModule } from '../music/local/local-music.module'
import { PlayerModule } from '../music/player/player.module'
import { AppController } from './app.controller'
import { PlayerController } from './player.controller'
import { WebClientController } from './web.controller'
import { WebService } from './web.service'
import { WS } from './websocket.gateway'

@Module({
  controllers: [WebClientController, PlayerController, AppController],

  providers: [WebService, WS],

  imports: [
    LoggerModule,
    ClientModule,
    PlayerModule,
    CoreModule,
    GuildConfigModule,
    LocalMusicModule.forRoot(),
  ],
})
export class WebModule {}
