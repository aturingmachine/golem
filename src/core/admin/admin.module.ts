import { Module } from '@nestjs/common'
import { MusicModule } from '../../music/music.module'
import { LoggerModule } from '../logger/logger.module'
import { PermissionsModule } from '../permissions/permissions.module'
import { AdminService } from './admin.service'

@Module({
  imports: [LoggerModule, PermissionsModule, MusicModule],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
