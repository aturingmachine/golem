import { EmbedBuilder, MessageReplyOptions } from 'discord.js'
import { ConfigurationService } from '../../core/configuration.service'
import { ReplyType } from './types'

export abstract class BaseReply {
  abstract readonly type: ReplyType

  /**
   * If true - only allow the latest of this.type to be
   * included in a rendered reply.
   */
  abstract readonly isUnique: boolean

  readonly opts: MessageReplyOptions

  constructor(opts: MessageReplyOptions) {
    this.opts = opts
  }

  static get isDebugEnabled(): boolean {
    return !!ConfigurationService.resolved.discord?.messageDebug
  }

  abstract addDebug(debugInfo: string): void

  addDebugContent(debugInfo: string): void {
    if (this.opts.content) {
      this.opts.content = this.opts.content + '\n' + debugInfo
    }
  }

  /**
   * Helper for adding debug info to a footer of an embed.
   *
   * @param debugInfo
   * @returns
   */
  addDebugFooter(debugInfo: string): void {
    const firstEmbed = this.opts.embeds?.[0]

    if (!firstEmbed) {
      return
    }

    if (!!firstEmbed && firstEmbed instanceof EmbedBuilder) {
      const existingFooter = firstEmbed.data.footer || { text: '' }
      const existingFooterText = existingFooter?.text
        ? existingFooter.text + ' '
        : ''

      firstEmbed.setFooter({
        ...existingFooter,
        text: existingFooterText.toString() + debugInfo,
      })

      return
    }

    if ('footer' in firstEmbed && !!firstEmbed.footer) {
      firstEmbed.footer = {
        ...firstEmbed.footer,
        text: firstEmbed.footer + '\n' + debugInfo,
      }

      return
    }
  }
}
