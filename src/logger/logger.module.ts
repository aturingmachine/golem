import { Module } from '@nestjs/common'
import { GolemLogger } from './logger.service'

@Module({
  providers: [GolemLogger],
  exports: [GolemLogger],
})
export class LoggerModule {}
