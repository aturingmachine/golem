import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { PermissionsModule } from '../permissions/permissions.module'
import { AdminService } from './admin.service'

@Module({
  imports: [LoggerModule, PermissionsModule],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
