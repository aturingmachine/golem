import { Replies } from '../messages/replies/types'

export type GolemErrorParams = {
  message: string
  sourceCmd: string
  requiresAdminAttention?: boolean
}

export abstract class GolemError extends Error {
  public hasRendered = false

  constructor(readonly params: GolemErrorParams) {
    super(params.message)
  }

  abstract toMessage(): Promise<Replies> | Replies

  async render(): Promise<Replies> {
    const reply = await this.toMessage()
    this.hasRendered = true

    return reply
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  static is(source?: any): source is GolemError {
    return !!source && source instanceof GolemError
  }
}