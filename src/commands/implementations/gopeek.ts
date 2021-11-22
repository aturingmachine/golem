import { CommandInteraction, Message } from 'discord.js'
import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { Golem } from '../../golem'
import { GolemLogger, LogSources } from '../../utils/logger'
import { GetPeekEmbed } from '../../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPeek })

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

const gopeek = new GolemCommand({
  logSource: LogSources.GoPeek,
  handler: execute,
  info: {
    name: CommandNames.peek,
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
