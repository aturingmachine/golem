import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../logger/logger.module'
import { PermissionsModule } from '../permissions/permissions.module'
import { GuildConfig } from './guild-config.model'
import { GuildConfigService } from './guild-config.service'

@Module({
  imports: [
    LoggerModule,
    PermissionsModule,
    TypeOrmModule.forFeature([GuildConfig]),
  ],

  providers: [GuildConfigService],

  exports: [GuildConfigService],
})
export class GuildConfigModule {}
