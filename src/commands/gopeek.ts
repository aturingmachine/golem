import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command2 } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPeekEmbed } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPeek })

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.peek)
//   .setDescription('See the next tracks in the queue.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  log.verbose('Executing')
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  const embed = GetPeekEmbed(player)

  await interaction.reply({ embeds: [embed] })
}

// const helpInfo: CommandHelp = {
//   name: 'peek',
//   msg: 'View the top of the play queue.',
//   args: [],
// }

// const goPeekCommand = new Command({
//   source: LogSources.GoPeek,
//   data,
//   handler: execute,
//   helpInfo,
// })

const gopeek = new Command2({
  logSource: LogSources.GoPeek,
  handler: execute,
  info: {
    name: CommandNames.peek,
    description: {
      long: 'See the next tracks in the queue.',
      short: 'See the next tracks in the queue.',
    },
    args: [],
    examples: ['$go peek'],
    requiredModules: [],
  },
})

export default gopeek
