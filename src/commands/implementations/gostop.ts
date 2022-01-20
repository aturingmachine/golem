import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const execute = async (interaction: GolemMessage): Promise<void> => {
  GolemLogger.info('executing', { src: LogSources.GoStop })

  await interaction.reply('Clearing the queue!')

  try {
    interaction.player.stop()
  } catch (error) {
    GolemLogger.warn('player stop threw error')
  }
}

const gostop = new GolemCommand({
  logSource: LogSources.GoStop,
  handler: execute,
  info: {
    name: CommandNames.Base.stop,
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
