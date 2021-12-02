import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'
import { GetPeekEmbed } from '../../utils/message-utils'

const execute = async (interaction: GolemMessage): Promise<void> => {
  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('invoked', { src: LogSources.GoShuffle })

  if (interaction.player.stats.count > 0) {
    interaction.player.shuffle()
    const embed = GetPeekEmbed(interaction.player)
    await interaction.reply({ content: 'Queue shuffled!', embeds: [embed] })
  } else {
    await interaction.reply('No queue to shuffle.')
  }
}

const goshuffle = new GolemCommand({
  logSource: LogSources.GoShuffle,
  handler: execute,
  info: {
    name: CommandNames.Base.shuffle,
    description: {
      short:
        "Shuffle the current queue maintaining the playnext queue's position.",
    },
    args: [],
    examples: {
      legacy: ['$go shuffle'],
      slashCommand: ['/goshuffle'],
    },
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
  },
})

export default goshuffle
