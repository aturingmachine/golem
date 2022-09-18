import { Module } from '@nestjs/common'
import { CommandService } from '../commands/commands.service'
import { MessageBuilderService } from '../messages/message-builder.service'
import { ProcessingTree } from '../messages/tree'
import { MusicModule } from '../music/music.module'
import { ClientService } from './client.service'
import { LoggerModule } from './logger/logger.module'
import { LoggerService } from './logger/logger.service'
import { MessageController } from './message.controller'

@Module({
  imports: [LoggerModule, MusicModule],
  controllers: [MessageController],
  providers: [
    CommandService,
    ProcessingTree,
    ClientService,
    LoggerService,
    MessageBuilderService,
  ],
  exports: [CommandService, ClientService, MessageBuilderService],
})
export class CoreModule {}
