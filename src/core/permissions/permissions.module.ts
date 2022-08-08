import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../logger/logger.module'
import { Permissions } from './permissions'
import { PermissionsService } from './permissions.service'

@Module({
  providers: [PermissionsService],
  exports: [PermissionsService],
  imports: [LoggerModule, TypeOrmModule.forFeature([Permissions])],
})
export class PermissionsModule {}
