import { RawReply } from '../messages/replies/raw'
import { GolemError, GolemErrorParams } from './golem-error'

export class ActivePlayerChannelMismatchError extends GolemError {
  constructor(params: GolemErrorParams) {
    super(params)
  }

  toMessage(): RawReply {
    return new RawReply(`Golem is already active in another Voice Channel.`)
  }
}
