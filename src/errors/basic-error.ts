import { PreformattedReply } from '../messages/replies/preformatted'
import { GolemError, GolemErrorParams } from './golem-error'

export class BasicError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      code: number
    }
  ) {
    super(params)
  }

  toMessage(): PreformattedReply {
    return new PreformattedReply(
      `Error: ${this.params.sourceCmd} - ${this.params.code} - ${this.params.message}`
    )
  }
}
