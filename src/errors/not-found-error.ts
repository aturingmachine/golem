import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class NotFoundError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      resource: string
      identifier: string
    }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(
      `No ${this.params.resource} found by lookup: ${this.params.identifier}.`
    )
  }
}
