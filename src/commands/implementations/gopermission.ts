import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { PermissionHandler } from '../../permissions/permission-handler'
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
      await PermissionHandler.describe(message)
      break
    case PermissionSubcommand.Get:
      await PermissionHandler.get(message)
      break
    case PermissionSubcommand.Set:
      await PermissionHandler.set(message)
      break
    case PermissionSubcommand.Add:
      await PermissionHandler.add(message)
      break
    case PermissionSubcommand.Remove:
      await PermissionHandler.remove(message)
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
              long: '',
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
              long: '',
              short: 'The user to grant permissions to.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permissions',
            description: {
              long: '',
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
              long: '',
              short: 'The user to grant permissions to.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permission',
            description: {
              long: '',
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
              long: '',
              short: 'The user to remove permissions from.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'permission',
            description: {
              long: '',
              short: 'The permissions to remove.',
            },
            required: true,
          },
        ],
      },
    ],
    args: [],
    examples: {
      legacy: [],
      slashCommand: [],
    },
  },
})

export default gopermission
