import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command2 } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.stop)
//   .setDescription('Clear the entire queue and stop the current player.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('executing', { src: LogSources.GoStop })

  await interaction.reply('Clearing the queue!')

  try {
    player.stop()
  } catch (error) {
    GolemLogger.warn('player stop threw error')
  }
}

// const helpInfo: CommandHelp = {
//   name: 'stop',
//   msg: 'Clears the current queue.',
//   args: [],
//   alias: '$stop',
// }

// const goStopCommand = new Command({
//   source: LogSources.GoStop,
//   data,
//   handler: execute,
//   helpInfo,
// })

const gostop = new Command2({
  logSource: LogSources.GoStop,
  handler: execute,
  info: {
    name: CommandNames.stop,
    description: {
      short: 'Stops the current playback.',
    },
    args: [],
    examples: [''],
    requiredModules: [],
    alias: '$stop',
  },
})

export default gostop
