import { BaseReply } from './base'
import { ReplyType } from './types'

export class PreformattedReply extends BaseReply {
  type = ReplyType.Preformatted
  isUnique = false

  constructor(content: string) {
    super({ content: '```\n' + content + '\n```' })
  }
}
