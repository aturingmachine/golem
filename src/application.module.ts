import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './core/configuration'
import { CoreModule } from './core/core.module'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
