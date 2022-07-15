import { Module } from '@nestjs/common'
import { DiscordModule } from '../djs/client.module'
import { GolemEventEmitter } from './event-emitter'
import { PlayerCache } from './player-cache'
import { PresenceManager } from './presence-manager'
import { GolemBot } from '.'

@Module({
  imports: [DiscordModule],
  providers: [PlayerCache, PresenceManager, GolemEventEmitter, GolemBot],
})
export class CoreModule {}
