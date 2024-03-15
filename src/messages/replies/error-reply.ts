import { DiscordMarkdown } from '../../utils/discord-markdown-builder'
import { BaseReply } from './base'
import { ReplyType } from './types'

/**
 * Helper Reply Class for wrapping unexpected errors.
 */
export class ErrorReply extends BaseReply {
  readonly type = ReplyType.RawError
  readonly isUnique = false

  readonly content: string

  constructor(error: Error) {
    const md = DiscordMarkdown.start()
      .markCode()
      .raw(`${new Date().toUTCString()}`)
      .newLine()
      .raw('An Unexpected Error Occurred.')
      .newLine()
      .raw(error.name)
      .newLine()
      .raw(error.message)

    if (error.stack) {
      md.newLine().raw(error.stack)
    }

    md.markCode()

    const content = md.toString()

    super({ content: content })

    this.content = content
  }

  addDebug(debugInfo: string): void {
    this.opts.content = DiscordMarkdown.start()
      .preformat(this.content.replaceAll('```', '') + '\n-----\n' + debugInfo)
      .toString()
  }
}
