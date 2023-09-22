import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogLine } from './log-line.model'
import { LoggerService } from './logger.service'

@Module({
  imports: [TypeOrmModule.forFeature([LogLine])],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
