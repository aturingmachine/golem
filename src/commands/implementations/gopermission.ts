import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'
import { StringFormat } from '../../utils/string-utils'

const log = GolemLogger.child({ src: LogSources.GoPermission })

export enum PermissionSubcommand {
  Describe = 'describe',
  Get = 'get',
  Set = 'set',
  Add = 'add',
  Remove = 'remove',
}

const execute = async (message: GolemMessage): Promise<void> => {
  log.info(`executing - ${message.parsed.subCommand}`)
  log.debug(`${message.toDebug()}`)

  switch (message.parsed.subCommand) {
    case PermissionSubcommand.Describe:
      await Handlers.Permissions.describe(message)
      break
    case PermissionSubcommand.Get:
      await Handlers.Permissions.get(message)
      break
    case PermissionSubcommand.Set:
      await Handlers.Permissions.set(message)
      break
    case PermissionSubcommand.Add:
      await Handlers.Permissions.add(message)
      break
    case PermissionSubcommand.Remove:
      await Handlers.Permissions.remove(message)
      break
    default:
      await message.reply(
        `Command "permission" requires a valid subcommand: ${StringFormat.bold(
          Object.values(PermissionSubcommand).join('|')
        )}`
      )
  }
}

const gopermission = new GolemCommand({
  logSource: LogSources.GoPermission,
  handler: execute,
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

export default gopermission
