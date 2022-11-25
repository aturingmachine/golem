import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from './core/configuration'
import { CoreModule } from './core/core.module'
import { IntegrationsModule } from './integrations/integration.module'
import { Library } from './music/local/library/library'
import { Album } from './music/local/listings/album'
import { LocalListing } from './music/local/listings/listings'
import { MusicModule } from './music/music.module'

@Module({
  imports: [
    CoreModule,
    MusicModule,
    IntegrationsModule,

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          connectTimeoutMS: 5000,
          ssl: false,
          useUnifiedTopology: true,
          useNewUrlParser: true,
          type: 'mongodb',
          url: 'mongodb://localhost:27017',
          synchronize: true,
          logging: true,
          database: config.get('mongo.dbName'),
          entities: [Library, LocalListing, Album],
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
