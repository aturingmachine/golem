import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class BadArgsError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      argName: string
      subcommand?: string
      format?: string
    }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    const formatString = this.params.format
      ? `\nCommand Format: \`${this.params.format}\``
      : ''
    return new RawReply(
      `Missing required argument ${this.params.argName} for ${
        this.params.sourceCmd
      }${
        this.params.subcommand ? `::${this.params.subcommand}` : ''
      }.${formatString}`
    )
  }
}
