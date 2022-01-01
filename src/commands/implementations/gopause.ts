import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const execute = async (interaction: GolemMessage): Promise<void> => {
  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('Executing', { src: LogSources.GoPause })

  await interaction.reply('Pausing playback...')
  interaction.player.pause()
}

const gopause = new GolemCommand({
  logSource: LogSources.GoPause,
  handler: execute,
  info: {
    name: CommandNames.Base.pause,
    description: {
      long: 'Pause the current playback.',
      short: 'Pause the current playback.',
    },
    args: [],
    examples: {
      legacy: ['$go pause'],
      slashCommand: ['/gopause'],
    },
    alias: '$pause',
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
  },
})

export default gopause
