import { Module } from '@nestjs/common'
import { PermissionsService, UserPermissionCache } from './permissions.service'

@Module({
  providers: [UserPermissionCache, PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
