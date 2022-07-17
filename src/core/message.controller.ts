import { Controller, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CONTEXT, MessagePattern, RequestContext } from '@nestjs/microservices'
import { Message } from 'discord.js'
import { GolemMessage } from '../messages/golem-message'
import { MessageInfo } from '../messages/message-info'
import { LoggerService } from './logger/logger.service'

@Controller()
export class MessageController {
  constructor(
    @Inject(CONTEXT) private ctx: RequestContext,
    private logger: LoggerService,
    private module: ModuleRef
  ) {}

  @MessagePattern('messageCreate')
  async handleMessage(data: { message: Message }): Promise<void> {
    console.log('inside handler')
    console.log(data.message.content)
    console.log(this.ctx.getContext())

    const messageLogger = await this.module.resolve(LoggerService)
    const message = new GolemMessage(data.message, messageLogger)
  }
}
