import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'
import { GetPeekEmbed } from '../../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPeek })

const execute = async (interaction: GolemMessage): Promise<void> => {
  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  const embed = GetPeekEmbed(interaction.player)

  await interaction.reply({ embeds: [embed] })
}

const gopeek = new GolemCommand({
  logSource: LogSources.GoPeek,
  handler: execute,
  info: {
    name: CommandNames.Base.peek,
    description: {
      long: 'See the next tracks in the queue.',
      short: 'See the next tracks in the queue.',
    },
    args: [],
    examples: {
      legacy: ['$go peek'],
      slashCommand: ['/gopeek'],
    },
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
  },
})

export default gopeek
