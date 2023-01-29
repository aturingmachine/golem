import { Module } from '@nestjs/common'
import { ClientService } from './client.service'
import { LoggerModule } from './logger/logger.module'

@Module({
  imports: [LoggerModule],

  providers: [ClientService],

  exports: [ClientService],
})
export class ClientModule {}
