import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'
import { _Command } from '../models/commands'

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.stop)
  .setDescription('Clear the entire queue and stop the current player.')

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

const goStopCommand = new _Command(LogSources.GoStop, data, execute)

export default goStopCommand
