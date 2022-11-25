import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { ConsoleLoggerOptions, LogLevel } from '@nestjs/common/services'
import { GolemMessage } from '../../messages/golem-message'
import { ArrayUtils } from '../../utils/list-utils'
import configuration from '../configuration'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(options: ConsoleLoggerOptions) {
    super('', { logLevels: configuration().logLevels, ...options })
  }

  setContext(...contexts: string[]): void {
    super.setContext(contexts.join('::'))
  }

  extendContext(additionalContext: string, append = false): void {
    const newContext = append
      ? [this.context, additionalContext]
      : [additionalContext, this.context]

    this.setContext(...newContext.filter(ArrayUtils.isDefined))
  }

  /**
   * @alias for ConsoleLogger.log for backwards compat
   * @param message
   * @param context
   */
  info(message: any): void {
    this.log(message)
  }

  silly(message: any, ...optionalParams: any[]): void {
    if (!this.isLevelEnabled('silly' as LogLevel)) {
      return
    }
    const { messages, context } = this._getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ])
    this.printMessages(messages, context, 'silly' as LogLevel)

    this.verbose(message)
  }

  setMessageContext(message: GolemMessage, context: string): void {
    this.setContext(context, message.traceId)
  }

  private _getContextAndMessagesToPrint(args: unknown[]) {
    if (args?.length <= 1) {
      return { messages: args, context: this.context }
    }

    const lastElement = args[args.length - 1]
    const isContext = typeof lastElement === 'string'

    if (!isContext) {
      return { messages: args, context: this.context }
    }

    return {
      context: lastElement as string,
      messages: args.slice(0, args.length - 1),
    }
  }
}
