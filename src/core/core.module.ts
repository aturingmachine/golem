import { Module } from '@nestjs/common'
import { CommandService } from '../commands/commands.service'
import { LoggerService } from './logger/logger.service'
import { MessageController } from './message.controller'

@Module({
  controllers: [MessageController],
  providers: [LoggerService, CommandService],
  exports: [LoggerService, CommandService],
})
export class CoreModule {}
