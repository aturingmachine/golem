import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { GolemMessage } from '../../messages/golem-message'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  /**
   * @alias for ConsoleLogger.log for backwards compat
   * @param message
   * @param context
   */
  info(message: any, context?: string): void {
    this.log(message, context)
  }

  silly(message: any, context?: string): void {
    this.verbose(message, context)
  }

  setMessageContext(message: GolemMessage, context: string): void {
    this.setContext(`${context}::${message.traceId}`)
  }
}
