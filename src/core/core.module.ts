import { Module } from '@nestjs/common'
import { CommandService } from '../commands/commands.service'
import { TreeService } from '../messages/tree'
import { MusicModule } from '../music/music.module'
import { ClientService } from './client.service'
import { LoggerModule } from './logger/logger.module'
import { LoggerService } from './logger/logger.service'
import { MessageController } from './message.controller'

@Module({
  imports: [LoggerModule, MusicModule],
  controllers: [MessageController],
  providers: [CommandService, TreeService, ClientService, LoggerService],
  exports: [CommandService, ClientService],
})
export class CoreModule {}
