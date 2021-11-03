import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('Executing', { src: LogSources.GoPause })

  await interaction.reply('Pausing playback...')
  player.pause()
}

const gopause = new Command({
  logSource: LogSources.GoPause,
  handler: execute,
  info: {
    name: CommandNames.pause,
    description: {
      long: 'Pause the current playback.',
      short: 'Pause the current playback.',
    },
    args: [],
    examples: {
      legacy: ['$go pause'],
      slashCommand: ['/gopause'],
    },
    requiredModules: [],
    alias: '$pause',
  },
})

export default gopause
