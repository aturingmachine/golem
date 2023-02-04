import { RawReply } from '../messages/replies/raw'
import { GolemError } from './golem-error'

export class NoPlayerError extends GolemError {
  constructor(params: { message: string; sourceCmd: string }) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(this.message)
  }
}
