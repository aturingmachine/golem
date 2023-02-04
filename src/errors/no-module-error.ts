import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class NoModuleError extends GolemError {
  constructor(
    readonly params: GolemErrorParams & {
      required: string[]
      action: string
    }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(
      `Cannot ${this.params.action} - ${this.params.required.join(
        ', '
      )} module is not loaded.`
    )
  }
}
