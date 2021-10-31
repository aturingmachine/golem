import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Command, CommandHelp } from '../models/commands'
import { CustomAlias } from '../models/custom-alias'
import { CustomAliasData } from '../models/db/custom-alias'
import { GolemLogger, LogSources } from '../utils/logger'
import { ParsedMessage } from '../utils/message-args'
import { guildIdFrom, userFrom } from '../utils/message-utils'
import { Replier } from '../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoAlias })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.alias)
  .setDescription('Register an alias for a command with arguments.')
  .addStringOption((option) =>
    option
      .setName('aliascommand')
      .setDescription(
        'Formatted as `<alias> => $<command>` anything after the ";" will be executed as a command.'
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

  const guildId = guildIdFrom(interaction)
  const userId = userFrom(interaction)

  if (!guildId || !userId) {
    log.error(`Missing required values: guildId=${guildId}; userId=${userId};`)

    return
  }

  // if (aliasCommand.includes('--test')) {
  //   const parsed = new ParsedMessage(aliasCommand)
  //   const alias = await CustomAlias.getAliasFor(parsed.args.name, guildId)

  //   if (alias) {
  //     await interaction.reply(
  //       `ALIAS=${alias.name}; UNEVAL=${alias.unevaluated}; EVAL=${alias.evaluated};`
  //     )
  //   } else {
  //     await interaction.reply(`cannot find alias: ${parsed.args.name}`)
  //   }

  //   return
  // }

  try {
    const alias = await CustomAlias.fromString(aliasCommand, guildId, userId)
    const record = new CustomAliasData(alias)

    log.verbose(`saving new alias ${alias.name} -> ${alias.unevaluated}`)
    await record.save()

    await interaction.reply(
      `${Replier.affirmative}! \`$${alias.name}\` will now execute as \`${alias.unevaluated}\``
    )
  } catch (error) {
    log.error(error)
    await interaction.reply(
      `${Replier.negative}, I couldn't make that alias. ${
        (error as Error).message
      }`
    )
  }
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
        'Formatted as `<alias> => $<command>`; anything before the => will have whitespace removed to form the alias name. Example: "$go alias my alias => $play twice tt" will bind "$myalias" to equal "$play twice tt."',
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
