import { Module } from '@nestjs/common'
import { GolemBot } from './golem'
import { PermissionsModule } from './permissions/permissions.module'

@Module({
  imports: [PermissionsModule],
  providers: [GolemBot],
})
export class AppModule {}
