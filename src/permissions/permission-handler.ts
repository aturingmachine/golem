import { Injectable } from '@nestjs/common'
import { commaLists, inlineLists } from 'common-tags'
import { ClientService } from '../djs/client.service'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'
import { GolemMessage } from '../messages/message-wrapper'
import { ArrayUtils } from '../utils/list-utils'
import { StringFormat } from '../utils/string-utils'
import {
  Permission,
  PermissionDescriptions,
  toPermission,
  UserPermission,
} from './permission'

@Injectable()
export class PermissionHandler {
  constructor(
    private logger: GolemLogger,
    private clientService: ClientService
  ) {
    this.logger.setContext(LogContexts.PermissionHandler)
  }

  async describe(message: GolemMessage): Promise<void> {
    this.logger.debug('describing permissions')
    const permString = Object.entries(PermissionDescriptions).reduce(
      (prev, curr) => {
        return prev.concat(`\n${curr[0]}: ${curr[1]}`)
      },
      ''
    )

    await message.reply(StringFormat.preformatted(permString))
  }

  async get(message: GolemMessage): Promise<void> {
    const userId = message.parsed.getUser()
    this.logger.debug(`getting permissions for ${userId}`)

    if (!userId) {
      await message.reply(`parameter - user - is required`)
      return
    }

    const record = await UserPermission.get(userId, message.info.guildId)
    const user = await this.clientService.getUser(userId)

    this.logger.debug(commaLists`got perms - ${record.permArray}`)

    await message.reply(
      StringFormat.preformatted(commaLists`User Permissions For ${user.username}:
      ${record.permArray}`)
    )
  }

  async set(message: GolemMessage): Promise<void> {
    const userId = message.parsed.getUser()
    const rawPermissions = message.parsed.getString('permissions')

    this.logger.debug(
      inlineLists`processing set permissions for ${userId} - ${rawPermissions}`
    )

    const authorPermissions = await message.info.permissions

    if (!authorPermissions.isAdmin) {
      await message.reply(
        `admin permissions are required to modify user's permissions`
      )
      return
    }

    if (!userId) {
      await message.reply(`parameter - user - is required`)
      return
    }

    if (!rawPermissions) {
      await message.reply(`parameter - permissions - is required`)
      return
    }

    const user = await this.clientService.getUser(userId)
    const parsedPermissions = rawPermissions
      .split(/(\s|;|,)/)
      .map(toPermission)
      .filter(ArrayUtils.isDefined)

    this.logger.debug(inlineLists`parsed permissions - ${parsedPermissions}`)

    if (
      [Permission.Admin, Permission.Moderator].some((perm) =>
        parsedPermissions.includes(perm)
      ) &&
      !authorPermissions.isAdmin
    ) {
      await message.reply(
        `Admin privileges are required to set Admin or Moderator privileges. Found in: ${parsedPermissions}`
      )
      return
    }

    const userPerms = await UserPermission.get(userId, message.info.guildId)
    userPerms.permissions = new Set(parsedPermissions)

    await message.reply(
      StringFormat.preformatted(
        inlineLists`Set permissions for ${user.username} to ${parsedPermissions}`
      )
    )
  }

  async add(message: GolemMessage): Promise<void> {
    const userId = message.parsed.getUser()
    const permToAdd = message.parsed.getString('permission')
    const authorPermissions = await message.info.permissions

    this.logger.debug(`adding ${permToAdd} to user ${userId}`)

    if (!authorPermissions.isAdmin) {
      await message.reply(
        `admin permissions are required to modify user's permissions`
      )
      return
    }

    if (!userId) {
      await message.reply(`parameter - user - is required`)
      return
    }

    if (!permToAdd) {
      await message.reply(`parameter - permission - is required`)
      return
    }

    const parsedPermission = toPermission(permToAdd)

    if (!parsedPermission) {
      await message.reply(
        `Invalid permission value: ${StringFormat.inline(permToAdd)}`
      )
      return
    }

    if (
      [Permission.Admin, Permission.Moderator].includes(parsedPermission) &&
      !authorPermissions.isAdmin
    ) {
      await message.reply(
        `Admin privileges are required to grant ${parsedPermission} privileges`
      )
      return
    }

    const userPerms = await UserPermission.get(userId, message.info.guildId)
    const addedPerms = userPerms.add(parsedPermission)
    await userPerms.save()

    const user = await this.clientService.getUser(userId)

    await message.reply(
      StringFormat.preformatted(
        commaLists`Added Permissions ${addedPerms} for ${user.username}`
      )
    )
  }

  async remove(message: GolemMessage): Promise<void> {
    const userId = message.parsed.getUser()
    const permToRemove = message.parsed.getString('permission')
    const authorPermissions = await message.info.permissions

    if (!authorPermissions.isAdmin) {
      await message.reply(
        `admin permissions are required to modify user's permissions`
      )
      return
    }

    if (!userId) {
      await message.reply(`parameter - user - is required`)
      return
    }
    if (!permToRemove) {
      await message.reply(`parameter - permission - is required`)
      return
    }

    const parsedPermission = toPermission(permToRemove)

    if (!parsedPermission) {
      await message.reply(
        `Invalid permission value: ${StringFormat.inline(permToRemove)}`
      )
      return
    }

    if (
      [Permission.Admin, Permission.Moderator].includes(parsedPermission) &&
      !authorPermissions.isAdmin
    ) {
      await message.reply(
        `Admin privileges are required to revoke ${parsedPermission} privileges`
      )
      return
    }

    const userPerms = await UserPermission.get(userId, message.info.guildId)
    const removedPerms = userPerms.remove(parsedPermission)
    await userPerms.save()

    const user = await this.clientService.getUser(userId)

    await message.reply(
      StringFormat.preformatted(commaLists`Removed Permissions ${removedPerms} for ${user.username}
      `)
    )
  }
}
