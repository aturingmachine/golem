import { GolemCommand } from '..'
import { AdminHandler } from '../../admin/admin-handler'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoAdmin })

export enum AdminSubcommands {
  LibRefresh = 'librefresh',
  Bugs = 'bugs',
}

const execute = async (message: GolemMessage): Promise<void> => {
  log.info('executing')
  const permissions = await message.info.permissions

  if (!permissions.isAdmin) {
    await message.reply({
      content: "You don't have the needed permissions to do that.",
    })
    return
  }

  const subcommand = message.parsed.subCommand

  switch (subcommand) {
    case AdminSubcommands.LibRefresh:
      AdminHandler.libRefresh(message)
      break
    case AdminSubcommands.Bugs:
      break
    default:
      if (!subcommand) {
        await message.reply({
          content: 'Command requires a subcommand',
        })
        return
      }
  }
}

const goadmin = new GolemCommand({
  logSource: LogSources.GoAdmin,
  handler: execute,
  info: {
    name: CommandNames.Base.admin,
    description: {
      short: 'Perform Administrative tasks.',
    },
    subcommands: [
      {
        name: 'librefresh',
        description: {
          short: 'Refresh all libraries, reading in new listings.',
        },
        args: [],
      },
      {
        name: 'bugs',
        description: {
          short: 'View last 5 bug reports.',
        },
        args: [],
      },
    ],
    args: [],
    examples: {
      legacy: ['$go admin librefresh'],
      slashCommand: ['/goadmin librefresh'],
    },
  },
})

export default goadmin
