import { MessageOptions } from 'discord.js'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class RawReply extends BaseReply {
  readonly type = ReplyType.Raw
  readonly isUnique = false

  constructor(content: string | MessageOptions) {
    super(typeof content === 'string' ? { content } : content)
  }
}
