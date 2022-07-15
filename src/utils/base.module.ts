import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { LoggerModule } from '../logger/logger.module'

/**
 * Contains Logger and Config Modules for reuse.
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  exports: [ConfigModule, LoggerModule],
})
export class BaseModule {}
