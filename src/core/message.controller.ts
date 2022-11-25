import { Controller, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CONTEXT, MessagePattern, RequestContext } from '@nestjs/microservices'
import { Message } from 'discord.js'
import { GolemMessage } from '../messages/golem-message'
import { ReplyType } from '../messages/replies/types'
import { ProcessingTree } from '../messages/tree'
import { LoggerService } from './logger/logger.service'

@Controller()
export class MessageController {
  constructor(
    @Inject(CONTEXT) private ctx: RequestContext,
    private logger: LoggerService,
    private ref: ModuleRef,
    private treeService: ProcessingTree
  ) {
    this.logger.setContext('MessageController')
  }

  @MessagePattern('messageCreate')
  async handleMessage(data: { message: Message }): Promise<void> {
    this.logger.info(data.message.content)

    if (!data.message.content.startsWith('$')) {
      return
    }

    const messageLogger = await this.ref.resolve(LoggerService)
    // TODO this seems wrong on many levels.
    const extraLogs = await Promise.all([
      this.ref.resolve(LoggerService),
      this.ref.resolve(LoggerService),
    ])
    const message = new GolemMessage(data.message, messageLogger, extraLogs)

    await this.treeService.execute(data.message.content, this.ref, message)

    const replies = message._replies.render()

    messageLogger.debug(
      `message commmand execute finished, generated replies: ${replies.length}`,
      messageLogger.extendContext('MessageController')
    )

    const state: Partial<Record<ReplyType, boolean>> = {}

    const uniqueReplies = replies.filter((rep) => {
      if (!rep.isUnique) {
        return true
      }

      this.logger.debug(`Filtering Unique Reply: ${rep.type}`)

      if (!!state[rep.type]) {
        this.logger.debug(
          `Unique reply already queued - skipping extra ${rep.type} instance`
        )
        return false
      }

      this.logger.debug(`First instance of ${rep.type} - adding to reply stack`)

      state[rep.type] = true
      return true
    })

    for (const reply of uniqueReplies) {
      this.logger.debug(
        `attempting to render ${reply.isUnique ? 'unqiue' : 'non-unique'} ${
          reply.type
        }`
      )

      try {
        await message.reply(reply.opts)
      } catch (error) {
        this.logger.error(`unable to render ${reply.type}`)
      }
    }
  }
}
