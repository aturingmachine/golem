import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { ConsoleLoggerOptions, LogLevel } from '@nestjs/common/services'
// import { InjectRepository } from '@nestjs/typeorm'
// import { MongoRepository } from 'typeorm'
import { GolemMessage } from '../../messages/golem-message'
import { ArrayUtils } from '../../utils/list-utils'
import configuration from '../configuration'
import { ConfigurationService } from '../configuration.service'
// import { LogLine } from './log-line.model'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(options: ConsoleLoggerOptions) {
    super('', { logLevels: configuration().logLevels, ...options })
  }

  setContext(...contexts: string[]): void {
    super.setContext(contexts.join('::'))
  }

  isLevelEnabled(level: LogLevel): boolean {
    return (
      super.isLevelEnabled(level) ||
      ConfigurationService.resolved.logLevels.includes(level)
    )
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
  info(message: any, ...optionalParams: any[]): void {
    this.log(message, ...optionalParams)
  }
  // (message: any, context?: string | undefined): void {
  //   this.log(message, context)
  // }

  error(message: any, ...optionalParams: any[]): void {
    const { messages, context } = this._getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ])

    this.printMessages(messages, context, 'error', 'stdout')
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

    // this.verbose(message)
  }

  setMessageContext(message: GolemMessage, context: string): void {
    this.setContext(context, message.traceId)
  }

  printMessages(
    messages: unknown[],
    context?: string | undefined,
    logLevel?: LogLevel | undefined,
    writeStreamType?: 'stdout' | 'stderr' | undefined
  ) {
    super.printMessages(messages, context, logLevel, writeStreamType)

    // const lines = messages.map((message) => ({
    //   message: message as string,
    //   context,
    //   level: logLevel || 'log',
    // }))

    // const createdLines = this.logs.create(lines)

    // this.logs.save(createdLines)
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
