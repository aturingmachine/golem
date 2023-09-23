import { Module } from '@nestjs/common'
import { ClientService } from './client.service'
import { LoggerModule } from './logger/logger.module'
import { BotPresenceService } from './presence.service'

@Module({
  imports: [LoggerModule],

  providers: [BotPresenceService, ClientService],

  exports: [ClientService, BotPresenceService],
})
export class ClientModule {}
