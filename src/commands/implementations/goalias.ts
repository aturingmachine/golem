import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoAlias })

const execute = async (interaction: GolemMessage): Promise<void> => {
  const subcommand = interaction.parsed.subCommand
  log.silly(interaction.toDebug())

  if (!subcommand) {
    await interaction.reply(`Please provide a valid subcommand`)

    return
  }

  if (!interaction.info.guildId || !interaction.info.userId) {
    log.error(
      `Missing required values: guildId=${interaction.info.guildId}; userId=${interaction.info.userId};`
    )

    return
  }

  switch (subcommand) {
    case 'create':
      const commandParam = interaction.parsed.getString('aliascommand')

      if (!commandParam) {
        await interaction.reply('Command requires a valid alias string')

        return
      }

      await Handlers.Alias.createAlias(interaction, commandParam)
      return

    case 'list':
    default:
      await Handlers.Alias.listAliases(interaction, interaction.info.guildId)
      return

    case 'delete':
      const aliasName = interaction.parsed.getString('aliasname')

      if (!aliasName) {
        await interaction.reply('Command requires a valid alias name')

        return
      }

      await Handlers.Alias.deleteAlias(interaction, aliasName)
      return
  }
}

const goalias = new GolemCommand({
  logSource: LogSources.GoAlias,
  handler: execute,
  info: {
    name: CommandNames.Base.alias,
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
