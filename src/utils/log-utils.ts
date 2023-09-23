import { INestApplicationContext } from '@nestjs/common'
import configuration from '../core/configuration'
import { LoggerService } from '../core/logger/logger.service'
import { GolemMessage } from '../messages/golem-message'

export class LogUtils {
  private static context: INestApplicationContext

  static setContext(context: INestApplicationContext): void {
    LogUtils.context = context
  }

  static async createLogger(context?: string, message?: GolemMessage) {
    const logger = await LogUtils.context.resolve(LoggerService)

    logger.setLogLevels(configuration().logLevels)

    if (message && context) {
      logger.setMessageContext(message, context)
    } else if (context) {
      logger.setContext(context)
    }

    return logger
  }
}
