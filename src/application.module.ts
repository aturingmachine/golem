import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomAlias } from './core/alias/alias.model'
import { AuditRecord } from './core/audits/audit.model'
import configuration from './core/configuration'
import { CoreModule } from './core/core.module'
import { GuildConfig } from './core/guild-config/guild-config.model'
import { LogLine } from './core/logger/log-line.model'
import { Permissions } from './core/permissions/permissions'
import { IntegrationsModule } from './integrations/integration.module'
import { CachedStream } from './music/cache/cached-stream.model'
import { Library } from './music/local/library/library'
import { Album } from './music/local/listings/album'
import { LocalListing } from './music/local/listings/listings'
import { MusicModule } from './music/music.module'
import { Playlist } from './music/playlists/playlist.model'
import { WebModule } from './web/web.module'

@Module({
  imports: [
    CoreModule,
    MusicModule,
    IntegrationsModule,
    WebModule,

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          // reconnectInterval: 60_000,
          connectTimeoutMS: 5000,
          ssl: false,
          useUnifiedTopology: true,
          useNewUrlParser: true,
          // reconnectTries: Number.MAX_VALUE,
          type: 'mongodb',
          url: 'mongodb://localhost:27017',
          synchronize: true,
          logging: true,
          database: config.get('mongo.dbName'),
          entities: [
            LogLine,
            Library,
            LocalListing,
            Album,
            CustomAlias,
            Permissions,
            Playlist,
            GuildConfig,
            AuditRecord,
            CachedStream,
          ],
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
