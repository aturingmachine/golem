import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class ExistingResourceError extends GolemError {
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
      `${this.params.resource} "${this.params.identifier}" already exists.`
    )
  }
}
