import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'

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
}
