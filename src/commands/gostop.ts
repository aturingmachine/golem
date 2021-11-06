import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { GolemLogger, LogSources } from '../utils/logger'

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

const gostop = new Command({
  logSource: LogSources.GoStop,
  handler: execute,
  info: {
    name: CommandNames.stop,
    description: {
      short: 'Stops the current playback.',
    },
    args: [],
    examples: {
      legacy: ['$go stop', '$stop'],
      slashCommand: ['/gostop'],
    },
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
    alias: '$stop',
  },
})

export default gostop
