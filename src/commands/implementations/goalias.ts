import { CommandInteraction, Message } from 'discord.js'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { formatForLog } from '../../utils/debug-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { guildIdFrom, userFrom } from '../../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoAlias })

const execute = async (
  interaction: CommandInteraction | Message,
  aliasContent?: string
): Promise<void> => {
  let subcommand = aliasContent?.split(' ').slice(0, 1).join('')
  let commandParam = aliasContent?.split(' ').slice(1).join(' ')
  log.silly(formatForLog({ subcommand, commandParam }))

  if (interaction instanceof CommandInteraction) {
    subcommand = interaction.options.getSubcommand()
    commandParam =
      interaction.options.getString('aliascommand') ||
      interaction.options.getString('aliasname') ||
      ''

    log.debug(
      `invoked as command with subcommand=${subcommand}; commandParam=${commandParam};`
    )
  }

  if (!subcommand) {
    await interaction.reply(`Please provide a valid subcommand`)

    return
  }

  const guildId = guildIdFrom(interaction)
  const userId = userFrom(interaction)

  if (!guildId || !userId) {
    log.error(`Missing required values: guildId=${guildId}; userId=${userId};`)

    return
  }

  switch (subcommand) {
    case 'create':
      if (!commandParam) {
        await interaction.reply('Command requires a valid alias string')

        return
      }

      await Handlers.Alias.createAlias(interaction, commandParam)
      return

    case 'list':
    default:
      await Handlers.Alias.listAliases(interaction, guildId)
      return

    case 'delete':
      if (!commandParam) {
        await interaction.reply('Command requires a valid alias string')

        return
      }

      await Handlers.Alias.deleteAlias(interaction, commandParam)
  }
}

const goalias = new GolemCommand({
  logSource: LogSources.GoAlias,
  handler: execute,
  info: {
    name: CommandNames.alias,
    description: {
      short: 'Interact with the aliases registered for this server.',
    },
    subcommands: [
      {
        name: 'create',
        description: {
          long: 'Create a new alias using GolemAlias format. [name of alias] => [full Golem command]. The alias will be made by removing white space within the "name of alias" section.',
          short: 'Create a new alias.',
        },
        args: [
          {
            type: 'string',
            name: 'aliascommand',
            description: {
              long: 'A GolemAlias string. Strings are formatted as "aliasName => $command". Everything to the left of the => delimiter will be stripped of whitespace to make the new alias name. When Golem recieves an alias it will execute the right side of the delimiter **as is**, and interperet it as if it is a new command.',
              short: 'A valid GolemAlias string. "aliasName => $go command"',
            },
            required: true,
          },
        ],
      },
      {
        name: 'delete',
        description: {
          long: 'Delete an alias by name. Requires the target alias to be created by the same user requesting the deletion or the requesting user to have elevated privileges.',
          short: 'Delete an alias by name.',
        },
        args: [
          {
            type: 'string',
            name: 'aliasname',
            description: {
              long: 'The name of the alias to delete. The name is equivalent to what one runs for the command without the prefixed $.',
              short: 'The name of the alias to delete.',
            },
            required: true,
          },
        ],
      },
      {
        name: 'list',
        description: {
          short: 'List aliases registered to this server.',
        },
        args: [],
      },
    ],
    args: [],
    examples: {
      legacy: [
        '$go alias create hype => $go play darude sandstorm',
        '$go alias list',
        '$go alias delete hype',
      ],
      slashCommand: [
        '/goalias create hype => $go play darude sandstorm',
        '/goalias list',
        '/goalias delete hype',
      ],
    },
  },
})

export default goalias
