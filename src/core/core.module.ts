import { Module } from '@nestjs/common'
import { CommandService } from '../commands/commands.service'
import { MessageBuilderService } from '../messages/message-builder.service'
import { ProcessingTree } from '../messages/tree'
import { MusicModule } from '../music/music.module'
import { AdminModule } from './admin/admin.module'
import { AliasModule } from './alias/alias.module'
import { ClientService } from './client.service'
import { InfoService } from './info/info.service'
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
  ],

  controllers: [MessageController],

  providers: [
    CommandService,
    ProcessingTree,
    ClientService,
    LoggerService,
    MessageBuilderService,
    InfoService,
  ],

  exports: [
    CommandService,
    ClientService,
    MessageBuilderService,
    InfoService,
    AdminModule,
  ],
})
export class CoreModule {}
