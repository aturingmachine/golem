import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Command, CommandHelp } from '../models/commands'
import { CustomAlias } from '../models/custom-alias'
import { CustomAliasData } from '../models/db/custom-alias'
import { GolemLogger, LogSources } from '../utils/logger'
import { userFrom } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.alias)
  .setDescription('Register an alias for a command with arguments.')
  .addStringOption((option) =>
    option
      .setName('aliascommand')
      .setDescription(
        'Formatted as `<alias> $<command>`; anything before the $ will be the alias name.'
      )
      .setRequired(true)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  aliasContent?: string
): Promise<void> => {
  let aliasCommand = aliasContent

  if (interaction instanceof CommandInteraction) {
    aliasCommand = interaction.options.getString('aliascommand') || ''
  }

  if (!aliasCommand) {
    await interaction.reply('Command requires a valid alias string')

    return
  }

  const guildId = interaction.guildId || interaction.guild?.id || ''
  const userId = userFrom(interaction)

  if (!guildId || !userId) {
    log.error(`Missing reuiqred values: guildId=${guildId}; userId={userId};`)
  }

  const buckIndex = aliasCommand.indexOf('$')
  const aliasName = aliasCommand.slice(0, buckIndex).replaceAll(' ', '')
  const fullCommand = aliasCommand.slice(buckIndex)
  const command = fullCommand.slice(0, fullCommand.indexOf(' '))
  const args = fullCommand.slice(fullCommand.indexOf(' '))

  const alias = new CustomAlias(aliasName, command, args, guildId, userId)

  const record = new CustomAliasData(alias)
  log.debug(`saving new alias ${aliasName} -> ${fullCommand}`)
  record.save()
}

const helpInfo: CommandHelp = {
  name: 'alias',
  msg: 'Register an aliased command to execute an existing command',
  args: [
    {
      name: 'aliasCommand',
      type: 'string',
      required: true,
      description:
        'Formatted as `<aliasname> $<command-string>`; anything before the $ will have whitespace removed to form the alias name. Example: "$go alias myalias $play twice tt" will bind $myalias to equal $play twice tt.',
    },
  ],
}

const goAliasCommand = new Command({
  source: LogSources.GoAlias,
  data,
  handler: execute,
  helpInfo,
})

export default goAliasCommand
