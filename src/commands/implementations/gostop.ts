import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const execute = async (interaction: GolemMessage): Promise<void> => {
  GolemLogger.info('executing', { src: LogSources.GoStop })

  if (!interaction.player) {
    await interaction.reply(
      'Unable to stop player. Not in a valid voice channel.'
    )
    GolemLogger.info(`no channel to join, exiting early`)
    return
  }

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
