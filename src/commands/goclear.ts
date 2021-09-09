import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { logger } from '../utils/logger'
import { Player } from '../voice/voice-handler'

const data = new SlashCommandBuilder()
  .setName('goclear')
  .setDescription('Clear the entire queue and stop the current player.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('GoSkip executing')

  await interaction.reply('Clearing the queue!')
  Player.clear()
}

export default {
  data,
  execute,
}
