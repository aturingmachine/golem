import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class NotOwnedError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      sourceAction: string
      resource: string
    }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(
      `Cannot ${this.params.sourceAction} ${this.params.resource}. Resource is owned by another user.`
    )
  }
}
