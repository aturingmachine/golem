import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class NoPrivilegesError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      required: string[]
      sourceAction: string
    }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    const permString =
      this.params.required.length > 1
        ? `one of [${this.params.required.join(', ')}]`
        : this.params.required[0]

    return new RawReply(
      `${this.params.sourceAction} requires ${permString} privileges.`
    )
  }
}
