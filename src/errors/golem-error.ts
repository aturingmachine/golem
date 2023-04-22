import { Replies } from '../messages/replies/types'

export type GolemErrorParams = {
  message: string
  sourceCmd: string
  requiresAdminAttention?: boolean
  traceId?: string
}

export abstract class GolemError extends Error {
  public hasRendered = false

  constructor(readonly params: GolemErrorParams) {
    super(params.message)
  }

  abstract toMessage(): Promise<Replies> | Replies

  toAdminString(): string {
    const dump = Object.entries(this.params)
      .map(([k, v]) => {
        return `${k.toUpperCase()}="${v}"`
      })
      .join('\n')

    return dump
  }

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
