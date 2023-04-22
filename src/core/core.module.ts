import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommandService } from '../commands/commands.service'
import { MessageBuilderService } from '../messages/message-builder.service'
import { ProcessingTree } from '../messages/tree'
import { MusicModule } from '../music/music.module'
import { AdminModule } from './admin/admin.module'
import { AliasModule } from './alias/alias.module'
import { AuditRecord } from './audits/audit.model'
import { AuditService } from './audits/audit.service'
import { ClientModule } from './client.module'
import { GuildConfigModule } from './guild-config/guild-config.module'
import { InfoService } from './info/info.service'
import { InitService } from './init.service'
import { LoggerModule } from './logger/logger.module'
import { LoggerService } from './logger/logger.service'
import { MessageController } from './message.controller'
import { PermissionsModule } from './permissions/permissions.module'

@Module({
  imports: [
    LoggerModule,
    MusicModule,
    PermissionsModule,
    AdminModule,
    AliasModule,
    ClientModule,
    GuildConfigModule,
    TypeOrmModule.forFeature([AuditRecord]),
  ],

  controllers: [MessageController],

  providers: [
    CommandService,
    ProcessingTree,
    LoggerService,
    MessageBuilderService,
    InfoService,
    MessageController,
    InitService,
    AuditService,
  ],

  exports: [
    CommandService,
    MessageBuilderService,
    InfoService,
    AdminModule,
    AuditService,
  ],
})
export class CoreModule {}
