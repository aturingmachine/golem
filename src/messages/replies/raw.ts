import { MessageReplyOptions } from 'discord.js'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class RawReply extends BaseReply {
  readonly type = ReplyType.Raw
  readonly isUnique = false

  constructor(content: string | MessageReplyOptions) {
    super(typeof content === 'string' ? { content } : content)
  }

  addDebug(debugInfo: string): void {
    this.addDebugContent('\n`' + debugInfo + '`')
  }
}
