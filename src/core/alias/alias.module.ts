import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../logger/logger.module'
import { CustomAlias } from './alias.model'
import { AliasService } from './alias.service'

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([CustomAlias])],

  providers: [AliasService],

  exports: [AliasService],
})
export class AliasModule {}
