import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { AliasHandler } from '../handlers/alias-handler'
import { Command } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { guildIdFrom, userFrom } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoAlias })

const execute = async (
  interaction: CommandInteraction | Message,
  aliasContent?: string
): Promise<void> => {
  let subcommand = aliasContent?.split(' ').slice(0, 1).join('')
  let aliasCommand = aliasContent?.split(' ').slice(1).join('')

  if (interaction instanceof CommandInteraction) {
    subcommand = interaction.options.getSubcommand()
    aliasCommand = interaction.options.getString('aliascommand') || ''

    log.debug(
      `invoked as command with subcommand=${subcommand}; aliasCommand=${aliasCommand};`
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

  if (subcommand === 'create') {
    if (!aliasCommand) {
      await interaction.reply('Command requires a valid alias string')

      return
    }

    await AliasHandler.createAlias(interaction, aliasCommand, guildId, userId)
    return
  }

  if (subcommand === 'list') {
    await AliasHandler.listAliases(interaction, guildId)
    return
  }
}

const goalias = new Command({
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
      ],
      slashCommand: [
        '/goalias create hype => $go play darude sandstorm',
        '/goalias list',
      ],
    },
    requiredModules: [],
  },
})

export default goalias
