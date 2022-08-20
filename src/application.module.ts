import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from './core/configuration'
import { CoreModule } from './core/core.module'
import { Library } from './music/library/library'
import { Album } from './music/listings/album'
import { LocalListing } from './music/listings/listings'
import { MusicModule } from './music/music.module'

@Module({
  imports: [
    CoreModule,
    MusicModule,

    ConfigModule.forRoot({
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        console.log('Processing Config for Database Connection...')

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
