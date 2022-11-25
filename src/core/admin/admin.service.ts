import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GolemMessage } from '../../messages/golem-message'
import { ListingLoaderService } from '../../music/local/library/loader.service'
import { LoggerService } from '../logger/logger.service'
import { PermissionsService } from '../permissions/permissions.service'

@Injectable()
export class AdminService {
  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private permissions: PermissionsService,

    @Optional()
    private loader: ListingLoaderService
  ) {
    this.log.setContext('AdminService')
  }

  async refreshLibraries(
    message: GolemMessage
  ): Promise<Record<string, number> | 1 | 2> {
    const isAdmin = await this.permissions.isAdmin(message)

    if (!isAdmin) {
      this.log.warn(
        `attempt at unauthorized access to AdminService.refreshLibraries! user="${message.info.userId}//${message.info.member?.displayName}" guild="${message.info.guildId}//${message.info.guild?.name}"`
      )

      return 1
    }

    if (!this.loader) {
      this.log.warn(`attempted to refresh libraries without LocalMusic module.`)

      return 2
    }

    const result = this.loader.refresh()

    return result
  }
}
