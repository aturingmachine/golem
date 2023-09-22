import { Module } from '@nestjs/common'
import { ClientModule } from '../client.module'
import { GuildConfigModule } from '../guild-config/guild-config.module'
import { LoggerModule } from '../logger/logger.module'
import { UpdatesService } from './updates.service'

@Module({
  imports: [LoggerModule, GuildConfigModule, ClientModule],

  providers: [UpdatesService],

  exports: [UpdatesService],
})
export class UpdatesModules {}
