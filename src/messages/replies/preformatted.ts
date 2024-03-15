import { DiscordMarkdown } from '../../utils/discord-markdown-builder'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class PreformattedReply extends BaseReply {
  type = ReplyType.Preformatted
  isUnique = false

  constructor(readonly rawContent: string) {
    super({ content: '```\n' + rawContent + '\n```' })
  }

  addDebug(debugInfo: string): void {
    this.opts.content = DiscordMarkdown.start()
      .preformat(this.rawContent + '\n' + debugInfo)
      .toString()
  }
}
