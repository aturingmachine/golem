import { Module } from '@nestjs/common'
import { LoggerModule } from '../core/logger/logger.module'
import { WebClientController } from './web.controller'

@Module({
  controllers: [WebClientController],
  imports: [LoggerModule],
})
export class WebModule {}
