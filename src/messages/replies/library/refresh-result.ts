import { Message } from 'discord.js'
import { StringFormat } from '../../../utils/string-utils'
import { GolemMessage } from '../../message-wrapper'

export class RefreshResult {
  constructor(
    public message: GolemMessage,
    public result: Record<string, number>
  ) {}

  toMessage(): string {
    const entries = Object.entries(this.result)

    const resultString = entries.reduce((prev, curr) => {
      return prev.concat(`${curr[0]}: ${curr[1]} new listings\n`)
    }, `Refreshed ${entries.length} Libraries:\n`)

    return StringFormat.preformatted(resultString)
  }

  send(): Promise<Message | undefined> {
    return this.message.reply(this.toMessage())
  }
}
