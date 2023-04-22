import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class NoPlayerError extends GolemError {
  constructor(
    params: GolemErrorParams & { message: string; sourceCmd: string }
  ) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(this.message)
  }
}
