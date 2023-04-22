import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import {
  PermissionCode,
  Permissions,
  tablePermissions,
} from '../../core/permissions/permissions'
import { PermissionsService } from '../../core/permissions/permissions.service'
import { Errors } from '../../errors'
import { PermissionChangeReply } from '../../messages/replies/permissions-change'
import { PreformattedReply } from '../../messages/replies/preformatted'
import { RawReply } from '../../messages/replies/raw'
import { ArrayUtils } from '../../utils/list-utils'

export enum PermissionSubcommand {
  Describe = 'describe',
  Get = 'get',
  Set = 'set',
  Add = 'add',
  Remove = 'remove',
}

export const PermissionDescriptions: Record<PermissionCode, string> = {
  [PermissionCode.Admin]: 'Super User. Reserved for whomever owns this Golem.',
  [PermissionCode.Moderator]: 'Super User restricted to a Guild.',
  [PermissionCode.AliasCreate]: 'Create new aliases.',
  [PermissionCode.AliasDelete]: 'Delete aliases.',
  [PermissionCode.AliasEdit]: 'Edit aliases.',
  [PermissionCode.PlaylistCreate]: 'Create Playlists.',
  [PermissionCode.PlaylistDelete]: 'Delete Playlists.',
  [PermissionCode.PlaylistEdit]: 'Edit Playlists.',
}

export function toPermission(str: string): PermissionCode | undefined {
  return Object.values(PermissionCode)
    .filter((perm) => perm === str)
    .pop()
}

export default new GolemCommand({
  logSource: 'GoPermissions',

  services: {
    permissions: PermissionsService,
    log: LoggerService,
  },

  subcommands: {
    get: {
      name: 'get',
      async handler({ message, source }) {
        const getUserIdParam = source.getUser('user')

        if (!getUserIdParam) {
          throw Errors.BadArgs({
            argName: 'user',
            sourceCmd: 'perms.get',
            message: '`perms get` requires an argument for `user`.',
            traceId: message.traceId,
          })
        }

        const perms = await this.services.permissions.lookup(
          getUserIdParam,
          message.info.guildId
        )

        if (!perms) {
          throw Errors.NotFound({
            message: 'No permissions record found.',
            sourceCmd: 'perms.get',
            resource: 'permissions',
            identifier: getUserIdParam,
            traceId: message.traceId,
          })
        }

        await message.addReply(
          new RawReply(tablePermissions(perms.permissions))
        )
      },
    },
    set: {
      name: 'set',
      async handler({ message, source }) {
        const setUserIdParam = source.getUser('user')

        if (!setUserIdParam) {
          throw Errors.BadArgs({
            argName: 'user',
            format: '$go perms set <user-id> <...permissions>',
            sourceCmd: 'perms.set',
            message: '`perms set` requires an argument for `user`.',
            traceId: message.traceId,
          })
        }

        const newPermissions = source.getString('permissions')

        if (!newPermissions) {
          throw Errors.BadArgs({
            argName: 'permissions',
            sourceCmd: 'perms.set',
            format: '$go perms set <user-id> <...permissions>',
            message:
              '`perms set` requires one more permission codes to set - separated by spaces.',
            traceId: message.traceId,
          })
        }

        const parsedPermissions = newPermissions
          .split(/(\s|;|,)/)
          .map(toPermission)
          .filter(ArrayUtils.isDefined)

        if (!parsedPermissions || !parsedPermissions.length) {
          throw Errors.BadArgs({
            argName: 'permissions',
            sourceCmd: 'perms.set',
            format: '$go perms set <user-id> <...permissions>',
            message: `Permission set "${newPermissions}" contains no valid Permission Codes. Use \`$go perms describe\` to view valid Permission Codes.`,
            traceId: message.traceId,
          })
        }

        const record = await this.services.permissions.lookup(
          setUserIdParam,
          message.info.guildId
        )

        if (!record) {
          this.services.log.warn(
            `attempt to set permissions on missing record ${setUserIdParam}@${message.info.guild?.name}`
          )
        }

        const setUpsertPermissions = await this.services.permissions.upsert(
          setUserIdParam,
          message.info.guildId,
          parsedPermissions
        )

        if (setUpsertPermissions) {
          await message.addReply(
            new RawReply(
              `Permissions "${parsedPermissions.join(
                ', '
              )}" set for ${message.getUserById(setUserIdParam)}.`
            )
          )
        }
      },
    },
    add: {
      name: 'add',
      async handler({ message, source }) {
        const addPermUserIdParam = source.getUser('user')
        const addPermPermissionParam = source.getString('permission')

        if (!addPermUserIdParam) {
          this.services.log.warn(`attempting to ADD permission without user id`)

          throw Errors.BadArgs({
            argName: 'user',
            sourceCmd: 'perms.add',
            format: '$go perms add <user-id> <permission>',
            message: '`perms add` requires an argument for `user`.',
            traceId: message.traceId,
          })
        }

        const addPermParsedPermissions = toPermission(
          addPermPermissionParam || ''
        )

        if (!addPermParsedPermissions) {
          this.services.log.warn(
            `attempting to ADD permissions with invalid permission codes. ${addPermPermissionParam}`
          )

          throw Errors.BadArgs({
            argName: 'permission',
            sourceCmd: 'perms.add',
            format: '$go perms add <user-id> <permission>',
            message:
              'Missing required, valid Permission Code to add. Use `$go permissions describe` to see valid Permission Codes.',
            traceId: message.traceId,
          })
        }

        const existingAddPermRecord = await this.services.permissions.lookup(
          addPermUserIdParam,
          message.info.guildId
        )

        if (existingAddPermRecord) {
          this.services.log.debug(
            `adding to existing permission record "${addPermParsedPermissions}" ${message.getUserById(
              addPermUserIdParam
            )}@${message.info.guildId}`
          )

          const addPermUpdated = ArrayUtils.setFrom([
            ...existingAddPermRecord.permissions,
            addPermParsedPermissions,
          ])

          await this.services.permissions.upsert(
            addPermUserIdParam,
            message.info.guildId,
            addPermUpdated
          )

          await message.addReply(
            new PermissionChangeReply(
              addPermUpdated,
              `Permissions updated for ${message.getUserById(
                addPermUserIdParam
              )}`
            )
          )
        } else {
          this.services.log.debug(
            `add missed record - need to create base to start "${addPermParsedPermissions}" ${message.getUserById(
              addPermUserIdParam
            )}@${message.info.guildId}`
          )

          const addPermCreateResult = this.services.permissions.upsert(
            addPermUserIdParam,
            message.info.guildId,
            ArrayUtils.setFrom([
              ...Permissions.BasePermissions,
              addPermParsedPermissions,
            ])
          )

          await message.addReply(
            new PermissionChangeReply(
              (
                await addPermCreateResult
              ).permissions,
              `Permissions created for ${message.getUserById(
                addPermUserIdParam
              )}`
            )
          )
        }
      },
    },
    remove: {
      name: 'remove',
      async handler({ message, source }) {
        const remPermUserIdParam = source.getUser('user')
        const remPermPermissionParam = source.getString('permission')

        if (!remPermUserIdParam) {
          this.services.log.warn(`attempting to ADD permission without user id`)

          throw Errors.BadArgs({
            argName: 'permission',
            sourceCmd: 'perms.remove',
            format: '$go perms remove <user-id> <permission>',
            message: 'Missing required parameter for user',
            traceId: message.traceId,
          })
        }

        const remPermParsedPermissions = toPermission(
          remPermPermissionParam || ''
        )

        if (!remPermParsedPermissions || !remPermParsedPermissions.length) {
          this.services.log.warn(
            `attempting to REMOVE permissions with invalid permission codes. ${remPermParsedPermissions}`
          )

          throw Errors.BadArgs({
            argName: 'permission',
            sourceCmd: 'perms.remove',
            format: '$go perms remove <user-id> <permission>',
            message:
              'Missing required, valid Permission Code to remove. Use `$go permissions describe` to see valid Permission Codes.',
            traceId: message.traceId,
          })
        }

        const remPermRecord = await this.services.permissions.lookup(
          remPermUserIdParam,
          message.info.guildId
        )

        if (!remPermRecord) {
          this.services.log.warn(
            `cannot remove permissions from missing record ${remPermUserIdParam}@${message.info.guildId}`
          )

          await message.addReply(
            new RawReply(
              `No Permissions record found for user ${message.getUserById(
                remPermUserIdParam
              )} on ${message.info.guild?.name}`
            )
          )

          throw Errors.NotFound({
            message: 'No permissions record found.',
            sourceCmd: 'perms.remove',
            resource: 'permissions',
            identifier: remPermUserIdParam,
            traceId: message.traceId,
          })
        }

        const updateRemPermissions = ArrayUtils.remove(
          remPermRecord.permissions,
          remPermPermissionParam as PermissionCode
        )

        const remPermResult = await this.services.permissions.upsert(
          remPermUserIdParam,
          message.info.guildId,
          updateRemPermissions
        )

        await message.addReply(
          new PermissionChangeReply(
            remPermResult.permissions,
            `Permission ${remPermPermissionParam} Removed.`
          )
        )
      },
    },
    describe: {
      name: 'describe',
      async handler({ message }) {
        const msg = tablePermissions(Object.values(PermissionCode))

        await message.addReply(new PreformattedReply(msg))
      },
    },
  },

  async handler(props): Promise<void> {
    const { message, source } = props
    this.services.log.setMessageContext(message, 'GoPermissions')

    this.services.log.debug(
      `attempting GoPerms using subcommand ${source.subCommand}`
    )

    return this.subcommandTree.run(this, props)
  },

  info: {
    name: CommandNames.Base.perms,
    description: {
      short: 'View and modify user permissions.',
    },
    subcommands: [
      {
        name: PermissionSubcommand.Describe,
        description: {
          short: 'View all grantable permissions.',
        },
        args: [],
      },
      {
        name: PermissionSubcommand.Get,
        description: {
          short: 'View permissions for a user',
        },
        args: [
          {
            type: 'user',
            name: 'user',
            description: {
              long: 'The mentioned user to fetch permissions for. Autocompleting the user using the `@` syntax will select the proper user.',
              short: 'The user to fetch permissions for.',
            },
            required: true,
          },
        ],
      },
      {
        name: PermissionSubcommand.Set,
        description: {
          short: 'Set the permissions for a user.',
        },
        args: [
          {
            type: 'user',
            name: 'user',
            description: {
              long: 'The mentioned user whos permissions should be set. Autocompleting the user using the `@` syntax will select the proper user.',
              short: 'The user whose permissions are being set.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permissions',
            description: {
              long: 'The dot notation based permission strings to set on the user. Delimit seperate permissions with a space to set multiple permissions. This will overwrite the users existing permissions',
              short:
                'The permissions to set, space delimited. Overwrites existing permissions.',
            },
            required: true,
            rest: true,
          },
        ],
      },
      {
        name: PermissionSubcommand.Add,
        description: {
          short: 'Grant a permission to a user',
        },
        args: [
          {
            type: 'user',
            name: 'user',
            description: {
              long: 'The mentioned user to grant permissions to. Autocompleting the user using the `@` syntax will select the proper user.',
              short: 'The user to grant permissions to.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permission',
            description: {
              long: 'The dot notation based permission string to grant to the user.',
              short: 'The permission to grant.',
            },
            required: true,
          },
        ],
      },
      {
        name: PermissionSubcommand.Remove,
        description: {
          short: 'Remove a permission from a user',
        },
        args: [
          {
            type: 'user',
            name: 'user',
            description: {
              long: 'The mentioned user to remove permissions from. Autocompleting the user using the `@` syntax will select the proper user.',
              short: 'The user to remove permissions from.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permission',
            description: {
              long: 'The dot notation based permission to remove from the user.',
              short: 'The permissions to remove.',
            },
            required: true,
          },
        ],
      },
    ],
    args: [],
    examples: {
      legacy: [
        '$go perms get @Kim Dahyun',
        '$go perms set @Kim Dahyun alias.create alias.edit moderator',
        '$go perms add @Kim Dahyun alias.delete',
        '$go perms remove @Kim Dahyun moderator',
      ],
      slashCommand: [
        '/goperms get @Kim Dahyun',
        '/goperms set @Kim Dahyun alias.create alias.edit moderator',
        '/goperms add @Kim Dahyun alias.delete',
        '/goperms remove @Kim Dahyun moderator',
      ],
    },
  },
})
