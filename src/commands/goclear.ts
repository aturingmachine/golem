import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Player } from '../player/music-player'
import { logger } from '../utils/logger'

const data = new SlashCommandBuilder()
  .setName('goclear')
  .setDescription('Clear the entire queue and stop the current player.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('executing', { src: 'GoSkip' })

  await interaction.reply('Clearing the queue!')
  Player.clear()
}

export default {
  data,
  execute,
}
