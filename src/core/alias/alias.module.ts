import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { AliasService } from './alias.service'

@Module({
  imports: [LoggerModule],

  providers: [AliasService],

  exports: [AliasService],
})
export class AliasModule {}
