import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { AdminHandler } from './admin-handler'

@Module({
  imports: [LoggerModule],
  providers: [AdminHandler],
  exports: [AdminHandler],
})
export class AdminModule {}
