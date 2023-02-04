import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NoModuleError } from '../../errors/no-module-error'
import { NoPrivilegesError } from '../../errors/no-privileges-error'
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
  ): Promise<Record<string, number>> {
    const isAdmin = await this.permissions.isAdmin(message)

    if (!isAdmin) {
      this.log.warn(
        `attempt at unauthorized access to AdminService.refreshLibraries! user="${message.info.userId}//${message.info.member?.displayName}" guild="${message.info.guildId}//${message.info.guild?.name}"`
      )

      throw new NoPrivilegesError({
        message: 'Attempting to LibRefresh without Admin Privileges.',
        sourceCmd: 'librefresh',
        sourceAction: 'Library Refresh',
        required: ['Administrator'],
      })
    }

    if (!this.loader) {
      this.log.warn(`attempted to refresh libraries without LocalMusic module.`)

      throw new NoModuleError({
        message: 'Attempting to LibRefresh without Admin Privileges.',
        sourceCmd: 'librefresh',
        required: ['Administrator'],
        action: 'refresh libraries',
      })
    }

    const result = this.loader.refresh()

    return result
  }
}
