import { MessageOptions } from 'discord.js'
import { ReplyType } from './types'

export abstract class BaseReply {
  abstract readonly type: ReplyType

  /**
   * If true - only allow the latest of this.type to be
   * included in a rendered reply.
   */
  abstract readonly isUnique: boolean

  constructor(readonly opts: MessageOptions) {}
}
