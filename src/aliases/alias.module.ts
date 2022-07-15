import { Module } from '@nestjs/common'
import { AliasRepository } from '../db/repositories/alias.repo'
import { BaseModule } from '../utils/base.module'
import { AliasService } from './alias.service'

@Module({
  imports: [BaseModule],
  providers: [AliasService, AliasRepository],
  exports: [AliasService, AliasRepository],
})
export class AliasModule {}
