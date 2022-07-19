import { Controller, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CONTEXT, MessagePattern, RequestContext } from '@nestjs/microservices'
import { Message } from 'discord.js'
import { GolemMessage } from '../messages/golem-message'
import { execute } from '../messages/tree'
import { LoggerService } from './logger/logger.service'

@Controller()
export class MessageController {
  constructor(
    @Inject(CONTEXT) private ctx: RequestContext,
    private logger: LoggerService,
    private module: ModuleRef
  ) {
    this.logger.setContext('message-controller')
  }

  @MessagePattern('messageCreate')
  async handleMessage(data: { message: Message }): Promise<void> {
    this.logger.info(data.message.content)

    if (!data.message.content.startsWith('$')) {
      return
    }

    const messageLogger = await this.module.resolve(LoggerService)
    const message = new GolemMessage(data.message, messageLogger)

    this.logger.info(message.toDebug())
    this.logger.info(message)

    const result = await execute(data.message.content)

    console.log(result)
  }
}
