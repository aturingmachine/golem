import { Controller, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CONTEXT, MessagePattern, RequestContext } from '@nestjs/microservices'
import { Message } from 'discord.js'
import { GSCompiler } from '../ast/compiler'
import { GolemMessage } from '../messages/golem-message'
import { MessageId } from '../messages/message-id.model'
import { ReplyType } from '../messages/replies/types'
import { ProcessingTree } from '../messages/tree'
import { AliasService } from './alias/alias.service'
import { LoggerService } from './logger/logger.service'

@Controller()
export class MessageController {
  constructor(
    @Inject(CONTEXT) private ctx: RequestContext,
    private logger: LoggerService,
    private ref: ModuleRef,
    private treeService: ProcessingTree,
    private aliasService: AliasService
  ) {
    this.logger.setContext('MessageController')
  }

  @MessagePattern('messageCreate')
  async handleMessage(data: { message: Message }): Promise<void> {
    this.logger.info(`raw message="${data.message.content}"`)

    // If we don't start with a buck then we can assume the message is not for us
    if (!data.message.content.startsWith('$')) {
      return
    }

    let messageContent = data.message.content

    const messageInfo = new MessageId(data.message)

    const messageLogger = await this.ref.resolve(LoggerService)
    // TODO this seems wrong on many levels.
    const extraLogs = await Promise.all([
      this.ref.resolve(LoggerService),
      this.ref.resolve(LoggerService),
    ])

    // Check if we have any hits for custom aliases
    const aliasHits = await this.aliasService.findAliases(
      messageInfo.guildId,
      data.message.content
    )

    this.logger.debug(
      `pre alias injection - messageContent="${messageContent}"`
    )

    // If we have an alias we want to expand it into a "raw" message string
    if (aliasHits && aliasHits.length > 0) {
      console.debug(
        `${messageContent} got an alias hit ${aliasHits.join(', ')}`
      )
      // Now we want to inject an expanded version of each hit into the stack
      messageContent = this.aliasService.injectHits(messageContent, aliasHits)
    }

    this.logger.debug(
      `post alias injection - messageContent="${messageContent}"`
    )

    const { ast, compiled } = GSCompiler.fromString(messageContent)

    const message = new GolemMessage(
      data.message,
      compiled,
      ast,
      messageLogger,
      extraLogs
    )

    await this.treeService._execute(compiled, message, this.ref)

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
