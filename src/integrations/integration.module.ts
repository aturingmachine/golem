import { Module } from '@nestjs/common'
import { PlexModule } from './plex/plex.module'

@Module({
  imports: [PlexModule.forRoot()],
})
export class IntegrationsModule {}
