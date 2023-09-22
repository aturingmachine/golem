import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BasicError } from '../../errors/basic-error'
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
    this.log.info(`attempting to refresh libraries via message`)
    this.log.info(
      `refresh attempt done by message.isAdminDM()? ${message.isAdminDM()}`
    )
    const isAdmin =
      message.isAdminDM() || (await this.permissions.isAdmin(message))
    this.log.info(`refresh attempt done by admin? ${isAdmin}`)

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

    const result = await this._forceRefresh()

    return result
  }

  async _forceRefresh(): Promise<Record<string, number>> {
    this.log.info(`attempting to run library refresh`)

    if (!this.loader) {
      this.log.warn(`attempted to refresh libraries without LocalMusic module.`)

      throw new NoModuleError({
        message: 'Attempting to LibRefresh without LocalMusic Module.',
        sourceCmd: 'librefresh',
        required: ['LocalMusic'],
        action: 'refresh libraries',
      })
    }

    try {
      const result = await this.loader.refresh()

      return result
    } catch (error) {
      this.log.error(`could not refresh libraries`, error)

      throw new BasicError({
        code: 500,
        message: 'Could not Refresh Libraries.',
        sourceCmd: '_forceRefresh',
      })
    }
  }
}
