import { Controller, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CONTEXT, MessagePattern, RequestContext } from '@nestjs/microservices'
import { Message } from 'discord.js'
import { GolemMessage } from '../messages/golem-message'
import { TreeService } from '../messages/tree'
import { LoggerService } from './logger/logger.service'

@Controller()
export class MessageController {
  constructor(
    @Inject(CONTEXT) private ctx: RequestContext,
    private logger: LoggerService,
    private ref: ModuleRef,
    private treeService: TreeService
  ) {
    this.logger.setContext('message-controller')
  }

  @MessagePattern('messageCreate')
  async handleMessage(data: { message: Message }): Promise<void> {
    this.logger.info(data.message.content)

    if (!data.message.content.startsWith('$')) {
      return
    }

    const messageLogger = await this.ref.resolve(LoggerService)
    const message = new GolemMessage(data.message, messageLogger)

    this.logger.info(message.toDebug())
    this.logger.info(message)

    const result = await this.treeService.execute(
      data.message.content,
      this.ref,
      message
    )

    console.log(result)

    for (const r of message._replies.render()) {
      await message.reply(r.opts)
    }
  }
}
