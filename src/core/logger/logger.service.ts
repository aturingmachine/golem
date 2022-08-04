import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { GolemMessage } from '../../messages/golem-message'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  /**
   * @alias for ConsoleLogger.log for backwards compat
   * @param message
   * @param context
   */
  info(message: any): void {
    this.log(message)
  }

  silly(message: any): void {
    this.verbose(message)
  }

  setMessageContext(message: GolemMessage, context: string): void {
    this.setContext(`${context}::${message.traceId}`)
  }
}
